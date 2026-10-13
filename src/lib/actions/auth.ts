"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { findUserByEmail, hashPassword, verifyPassword } from "@/lib/auth";
import { insertUser, createSession, deleteSession } from "@/lib/backend";
import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";

export interface AuthFormState {
  error?: string;
}

function safeCallbackUrl(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return "/";
  return value;
}
export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  if (
    !name ||
    name.length > 200 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254
  ) {
    return { error: "กรุณาตรวจสอบชื่อและอีเมล" };
  }
  if (password.length < 6 || Buffer.byteLength(password, "utf8") > 72) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร และไม่เกิน 72 ไบต์" };
  }
  try {
    if (await findUserByEmail(email))
      return { error: "อีเมลนี้มีผู้ใช้งานแล้ว" };
    await insertUser({
      id: crypto.randomUUID(),
      email,
      name,
      password: await hashPassword(password),
    });
  } catch {
    return {
      error:
        "ไม่สามารถสมัครสมาชิกได้ ฐานข้อมูลอาจไม่พร้อมใช้งาน หรืออีเมลนี้มีผู้ใช้แล้ว",
    };
  }
  redirect("/login");
}
export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  try {
    const user = await findUserByEmail(email);
    if (!user?.password || !(await verifyPassword(password, user.password))) {
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }
    (await cookies()).set(AUTH_COOKIE_NAME, await createSession(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 86400,
      path: "/",
    });
  } catch {
    return { error: "ฐานข้อมูลไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง" };
  }
  revalidatePath("/", "layout");
  redirect(safeCallbackUrl(formData.get("callbackUrl") as string | null));
}
export async function logoutAction() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (token) await deleteSession(token);
  store.delete(AUTH_COOKIE_NAME);
  revalidatePath("/", "layout");
  redirect("/login");
}
