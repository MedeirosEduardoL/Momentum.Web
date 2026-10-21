#!/usr/bin/env bash
set -uo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "Fora de um repositório git."; exit 2; }
cd "$repo_root" || exit 2

modo="paths"
formato="texto"
args=()
for a in "$@"; do
  case "$a" in
    --all)  modo="all" ;;
    --diff) modo="diff" ;;
    --json) formato="json" ;;
    --help|-h)
      cat <<'HELP'
knowledge-match.sh — casa caminhos de código com o conhecimento de ai/knowledge/

  knowledge-match.sh <path>...     conhecimentos que esses caminhos tocam
  knowledge-match.sh --diff [ref]  o mesmo, para os arquivos alterados (default: vs HEAD)
  knowledge-match.sh --all         lista todo o conhecimento consolidado
  knowledge-match.sh ... --json    saída em JSON

Sai com 0 quando não há conhecimento tocado, 3 quando há (para uso em hook).
HELP
      exit 0 ;;
    *) args+=("$a") ;;
  esac
done

alvos=()
if [ "$modo" = "diff" ]; then
  ref="${args[0]:-}"
  if [ -n "$ref" ]; then
    fonte="$(git diff --name-only "$ref...HEAD" 2>/dev/null; git diff --name-only "$ref" 2>/dev/null)"
  else
    fonte="$(git diff --name-only HEAD; git ls-files --others --exclude-standard)"
  fi
  while IFS= read -r linha; do
    [ -n "$linha" ] && alvos[${#alvos[@]}]="$linha"
  done <<< "$fonte"
elif [ "${#args[@]}" -gt 0 ]; then
  alvos=("${args[@]}")
fi

KDIR="ai/knowledge" ALVOS="$(if [ "${#alvos[@]}" -gt 0 ]; then printf '%s\n' "${alvos[@]}"; fi)" MODO="$modo" FORMATO="$formato" PYTHONIOENCODING=utf-8 python3 <<'PY'
import os, re, json, fnmatch, pathlib, sys

kdir = pathlib.Path(os.environ["KDIR"])
modo, formato = os.environ["MODO"], os.environ["FORMATO"]
alvos = [a for a in os.environ["ALVOS"].splitlines() if a.strip()]

def parse(path):
    txt = path.read_text(encoding="utf-8", errors="replace")
    m = re.match(r"^---\n(.*?)\n---\n", txt, re.S)
    meta, lista, chave = {}, None, None
    if m:
        for raw in m.group(1).splitlines():
            if re.match(r"^\s*-\s", raw) and chave:
                meta.setdefault(chave, []).append(raw.strip()[1:].strip())
                continue
            mm = re.match(r"^([A-Za-z_]+):\s*(.*)$", raw)
            if mm:
                chave, val = mm.group(1), mm.group(2).strip()
                if val.startswith("[") and val.endswith("]"):
                    meta[chave] = [x.strip() for x in val[1:-1].split(",") if x.strip()]
                elif val:
                    meta[chave] = val
                else:
                    meta[chave] = []
    meta["_invariantes"] = re.findall(r"^-\s*(INV-\d+):", txt, re.M)
    meta.setdefault("id", path.stem)
    meta.setdefault("titulo", "(sem título)")
    meta.setdefault("status", "ativo")
    meta.setdefault("touches", [])
    meta["_arquivo"] = path.as_posix()
    return meta

if not kdir.is_dir():
    print("ai/knowledge/ não existe. Nenhum conhecimento consolidado ainda — use /teach para criar o primeiro.")
    sys.exit(0)

conhecimentos = [parse(p) for p in sorted(kdir.glob("*.md"))
                 if p.name not in ("README.md", "_TEMPLATE.md")]

def casa(glob, alvo):
    if fnmatch.fnmatch(alvo, glob):
        return True
    if glob.endswith("/**"):
        return alvo.startswith(glob[:-2])
    return False

if modo == "all":
    ativos = [k for k in conhecimentos if k["status"] == "ativo"]
    outros = [k for k in conhecimentos if k["status"] != "ativo"]
    if formato == "json":
        print(json.dumps(conhecimentos, ensure_ascii=False, indent=2)); sys.exit(0)
    if not conhecimentos:
        print("Nenhum conhecimento consolidado ainda. Use /teach para criar o primeiro."); sys.exit(0)
    print(f"CONHECIMENTO CONSOLIDADO — {len(ativos)} ativo(s), {len(outros)} revogado(s)\n")
    for k in ativos:
        print(f"  {k['id']:<34} {len(k['_invariantes'])} inv   {k['titulo']}")
    for k in outros:
        print(f"  {k['id']:<34} [{k['status']}]   {k['titulo']}")
    print("\nLeia o arquivo do conhecimento antes de editar o que ele cobre: ai/knowledge/<id>.md")
    sys.exit(0)

if not alvos:
    print("Nenhum caminho informado e nenhum arquivo alterado."); sys.exit(0)

achados = []
for k in conhecimentos:
    if k["status"] != "ativo":
        continue
    casados = [(a, g) for a in alvos for g in k["touches"] if casa(g, a)]
    if casados:
        achados.append((k, casados))

if formato == "json":
    print(json.dumps([{**k, "_casou": [{"path": a, "glob": g} for a, g in c]}
                      for k, c in achados], ensure_ascii=False, indent=2))
    sys.exit(3 if achados else 0)

if not achados:
    print(f"Nenhum conhecimento consolidado cobre {len(alvos)} caminho(s) analisado(s).")
    sys.exit(0)

print(f"⚠ CONHECIMENTO TOCADO — {len(achados)}. Leia antes da primeira edição.\n")
for k, casados in achados:
    print(f"  {k['id']}  →  {k['_arquivo']}")
    print(f"    {k['titulo']}")
    print(f"    invariantes: {', '.join(k['_invariantes']) or 'nenhum declarado'}")
    for a, g in sorted(set(casados))[:4]:
        print(f"    casou: {a}  (touches: {g})")
    print()
print("Se o pedido ferir um invariante: NÃO implemente. Cite o INV-n, explique a")
print("consequência e pergunte ao usuário. Só siga com confirmação explícita.")
sys.exit(3)
PY
