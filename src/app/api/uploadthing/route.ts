import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const WORDPRESS_UPLOAD_URL =
  "https://app.scoutabasegroup.com/wp-json/user-media/v1/upload";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("wp-jwt")?.value;

    console.log({ token });

    if (!token) {
      return NextResponse.json(
        { status: "error", message: "Authentication token not found" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files");

    // Validate files
    const validFiles = files.filter(
      (file): file is File => file instanceof File
    );

    if (validFiles.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Please select at least one valid file to upload",
        },
        { status: 400 }
      );
    }

    // Prepare the upload request to the WordPress server
    const wpFormData = new FormData();
    validFiles.forEach((file) => {
      wpFormData.append("file[]", file);
    });

    // Send files to the WordPress API
    const wpResponse = await fetch(WORDPRESS_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: wpFormData,
    });

    const wpData = await wpResponse.json();
    console.log({ wpData });

    if (wpResponse.ok && wpData.status === "success") {
      return NextResponse.json({
        status: "success",
        message: "Files uploaded successfully!",
        urls: wpData.urls, // Assuming the WordPress API returns an array of uploaded files
      });
    } else {
      return NextResponse.json(
        { status: "error", message: wpData.message || "Upload failed" },
        { status: wpResponse.status }
      );
    }
  } catch (e: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "An error occurred while uploading the files",
      },
      { status: 500 }
    );
  }
}
