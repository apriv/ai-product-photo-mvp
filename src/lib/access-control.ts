import { ACCESS_PASSWORD_FIELD } from "@/lib/access-shared";

type AccessCheck =
  | { ok: true }
  | {
      ok: false;
      status: 401 | 500;
      error: string;
    };

export function validateAccessPassword(
  password: FormDataEntryValue | string | null | undefined
): AccessCheck {
  const configuredPassword = process.env.APP_PASSWORD;

  if (!configuredPassword) {
    return {
      ok: false,
      status: 500,
      error: "服务端未配置访问密码",
    };
  }

  if (typeof password !== "string" || password !== configuredPassword) {
    return {
      ok: false,
      status: 401,
      error: "访问密码错误",
    };
  }

  return { ok: true };
}

export function getAccessPassword(formData: FormData) {
  return formData.get(ACCESS_PASSWORD_FIELD);
}
