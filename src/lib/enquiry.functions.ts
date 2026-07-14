// Client-side stub for enquiry submission.
// The full app wires this to a server function backed by Lovable Cloud.
// Until Cloud is enabled, we log the enquiry and resolve so the form UX works;
// visitors are also encouraged to reach out via WhatsApp or phone.

export type EnquiryPayload = {
  data: {
    fullName: string;
    email: string;
    phone: string;
    subject: string;
    propertyInterest?: string;
    budget?: string;
    message: string;
    company?: string;
  };
};

export async function submitEnquiry(payload: EnquiryPayload): Promise<{ ok: true }> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.info("[enquiry] received", payload.data);
  }
  return { ok: true };
}
