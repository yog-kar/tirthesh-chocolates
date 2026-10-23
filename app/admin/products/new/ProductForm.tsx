
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

export default function ProductForm() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [form, setForm] = useState({
    business: "TIRTHESH_CHOCOLATES",
    name: "",
    slug: "",
    description: "",
    price: "",
    stock: "0",
    imageUrl: "",
  });

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  function update(field: keyof typeof form, value: string) {
    setForm((previous) => {
      const next = { ...previous, [field]: value };

      if (field === "name") {
        next.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }

      return next;
    });
  }

  async function uploadImage(file: File): Promise<string> {
    setMessage("Preparing secure image upload...");

    const signatureResponse = await fetch(
      "/api/cloudinary-signature",
      { method: "POST" },
    );

    const signatureData = await signatureResponse.json();

    if (!signatureResponse.ok) {
      throw new Error(
        signatureData.error || "Could not authorize image upload.",
      );
    }

    const signed = signatureData as UploadSignature;
    const uploadData = new FormData();

    uploadData.append("file", file);
    uploadData.append("api_key", signed.apiKey);
    uploadData.append("timestamp", String(signed.timestamp));
    uploadData.append("folder", signed.folder);
    uploadData.append("signature", signed.signature);

    setMessage("Uploading product image...");

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadData,
      },
    );

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadResult.secure_url) {
      throw new Error(
        uploadResult.error?.message || "Image upload failed.",
      );
    }

    return uploadResult.secure_url as string;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      let imageUrl = form.imageUrl;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      setMessage("Saving product...");

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageUrl,
          price: Number(form.price),
          stock: Number(form.stock),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to save product.");
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    padding: "12px 13px",
    border: "1px solid #dfe1e5",
    borderRadius: 9,
    fontSize: 14,
    background: "#fff",
    color: "#202124",
  } as const;

  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
    color: "#353840",
  } as const;

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
      <div>
        <label htmlFor="business" style={labelStyle}>
          Business
        </label>
        <select
          id="business"
          style={fieldStyle}
          value={form.business}
          onChange={(event) => update("business", event.target.value)}
        >
          <option value="TIRTHESH_CHOCOLATES">
            Tirthesh Chocolates
          </option>
          <option value="JAYANAND_FOODS">Jayanand Foods</option>
        </select>
      </div>

      <div>
        <label htmlFor="name" style={labelStyle}>
          Product name
        </label>
        <input
          id="name"
          required
          maxLength={160}
          style={fieldStyle}
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="e.g. Cranberry Chocolate"
        />
      </div>

      <div>
        <label htmlFor="slug" style={labelStyle}>
          Product URL slug
        </label>
        <input
          id="slug"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          style={fieldStyle}
          value={form.slug}
          onChange={(event) => update("slug", event.target.value)}
          placeholder="cranberry-chocolate"
        />
        <small style={{ color: "#737780" }}>
          Generated from the product name. You can edit it.
        </small>
      </div>

      <div>
        <label htmlFor="description" style={labelStyle}>
          Description
        </label>
        <textarea
          id="description"
          maxLength={5000}
          rows={4}
          style={{ ...fieldStyle, resize: "vertical" }}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Describe the product..."
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 16,
        }}
      >
        <div>
          <label htmlFor="price" style={labelStyle}>
            Price (₹)
          </label>
          <input
            id="price"
            type="number"
            required
            min="0.01"
            step="0.01"
            style={fieldStyle}
            value={form.price}
            onChange={(event) => update("price", event.target.value)}
            placeholder="499"
          />
        </div>

        <div>
          <label htmlFor="stock" style={labelStyle}>
            Stock quantity
          </label>
          <input
            id="stock"
            type="number"
            required
            min="0"
            step="1"
            style={fieldStyle}
            value={form.stock}
            onChange={(event) => update("stock", event.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="imageFile" style={labelStyle}>
          Product photo
        </label>

        <input
          id="imageFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={saving}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;

            if (file && file.size > 5 * 1024 * 1024) {
              setMessage("Choose an image smaller than 5 MB.");
              event.target.value = "";
              setImageFile(null);
              return;
            }

            setMessage("");
            setImageFile(file);
            setForm((previous) => ({
              ...previous,
              imageUrl: "",
            }));
          }}
          style={{
            ...fieldStyle,
            padding: 10,
          }}
        />

        <small style={{ display: "block", color: "#737780", marginTop: 8 }}>
          Choose a photo from your phone gallery or computer.
          JPG, PNG or WebP, up to 5 MB.
        </small>

        {imagePreview && (
          <div style={{ marginTop: 14 }}>
            <img
              src={imagePreview}
              alt="Selected product preview"
              style={{
                width: "100%",
                maxWidth: 280,
                maxHeight: 240,
                objectFit: "contain",
                border: "1px solid #e7e8eb",
                borderRadius: 12,
                background: "#f8f9fb",
              }}
            />

            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setImageFile(null);
                setMessage("");
              }}
              style={{
                display: "block",
                marginTop: 8,
                border: "1px solid #dfe1e5",
                borderRadius: 8,
                background: "#fff",
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              Remove photo
            </button>
          </div>
        )}
      </div>

      {message && (
        <p role="status" style={{ fontSize: 14, color: "#353840" }}>
          {message}
        </p>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            border: 0,
            borderRadius: 9,
            padding: "13px 20px",
            background: "#202124",
            color: "#fff",
            fontWeight: 600,
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Please wait..." : "Create product"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => router.push("/admin")}
          style={{
            border: "1px solid #dfe1e5",
            borderRadius: 9,
            padding: "13px 20px",
            background: "#fff",
            color: "#202124",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
