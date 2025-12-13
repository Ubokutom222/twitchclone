import pusherInstance from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let socketId: string | null = null;
    let channel: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      socketId = body?.socket_id ?? null;
      channel = body?.channel_name ?? null;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      socketId = params.get("socket_id");
      channel = params.get("channel_name");
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      socketId = (form.get("socket_id") as string) ?? null;
      channel = (form.get("channel_name") as string) ?? null;
    } else {
      // Fallback: try parsing JSON
      try {
        const body = await req.json();
        socketId = body?.socket_id ?? null;
        channel = body?.channel_name ?? null;
      } catch {
        // ignore
      }
    }

    if (!socketId || !channel) {
      return new NextResponse("Missing socket_id or channel_name", {
        status: 400,
      });
    }

    const authResponse = pusherInstance.authorizeChannel(socketId, channel);

    return NextResponse.json(authResponse, { status: 200 });
  } catch (error) {
    console.error(error);
    return new NextResponse(null, { status: 403 });
  }
}
