export type Account = {
  id: string;
  name: string;
  email: string;
};

export type AccountRegistration = {
  name: string;
  email: string;
};

export type LinkPassword = {
  token: string;
  password: string;
};

export type EmailVerification = {
  token: string;
  name: string;
  password: string;
};

export type EmailVerificationPreview = {
  name: string;
};
