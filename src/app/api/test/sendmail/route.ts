import { TestEmailComponent } from "@/components/email/test";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST() {
  try {
    const { data, error } = await resend.emails.send({
      from: "accounts.gym-embrace@btmxh.dpdns.org",
      to: "ngoduyanh.chip@gmail.com",
      subject: "Test Email from Resend",
      react: TestEmailComponent({ name: "Diddy" }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
