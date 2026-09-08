import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pincode: string }> }
) {
  const { pincode } = await params;

  if (!/^[1-9]\d{5}$/.test(pincode)) {
    return NextResponse.json(
      { message: "Invalid PIN code format", code: "INVALID_PINCODE" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/location/pincode/${pincode}`, {
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Location service unavailable", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
