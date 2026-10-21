import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/rbac-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUserSession();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      isAdmin: user.isAdmin,
      isEditor: user.isEditor,
      isViewer: user.isViewer,
      permissions: user.permissions,
    },
  });
}
