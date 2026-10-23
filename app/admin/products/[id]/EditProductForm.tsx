"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  business: "TIRTHESH_CHOCOLATES" | "JAYANAND_FOODS";
  name: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  imageUrl: string;
  isActive: boolean;
};

type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

export default function EditProductForm({
  product,
}: {
  product: Product;
}) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [form, setForm] = useState({
    business: product.business,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    price: String(product.price),
    stock: String(product.stock),
    imageUrl: product.imageUrl ?? "",
    isActive: product.isActive,
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

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((previous) => {
      const next = { ...previous, [field]: value };

      if (field === "name" && typeof value === "string") {
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

      setMessage("Updating product...");

      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business: form.business,
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          stock: Number(form.stock),
          imageUrl,
          isActive: form.isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update product.");
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
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
    color: "#353840",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: 20 }}
    >
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

          <option value="JAYANAND_FOODS">
            Jayanand Foods
          </option>
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
        />

        <small style={{ color: "#737780" }}>
          Changing the slug changes the product URL.
        </small>
      </div>

      <div>
        <label htmlFor="description" style={labelStyle}>
          Description
        </label>

        <textarea
          id="description"
          rows={4}
          maxLength={5000}
          style={{ ...fieldStyle, resize: "vertical" }}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
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
            min="0.01"
            step="0.01"
            required
            style={fieldStyle}
            value={form.price}
            onChange={(event) => update("price", event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="stock" style={labelStyle}>
            Stock quantity
          </label>

          <input
            id="stock"
            type="number"
            min="0"
            step="1"
            required
            style={fieldStyle}
            value={form.stock}
            onChange={(event) => update("stock", event.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="isActive" style={labelStyle}>
          Product availability
        </label>

        <select
          id="isActive"
          style={fieldStyle}
          value={String(form.isActive)}
          onChange={(event) =>
            update("isActive", event.target.value === "true")
          }
        >
          <option value="true">Available in store</option>
          <option value="false">Unavailable in store</option>
        </select>
      </div>

      <div>
        <label htmlFor="imageFile" style={labelStyle}>
          Replace product photo
        </label>

        {form.imageUrl && !imageFile && (
          <img
            src={form.imageUrl}
            alt={form.name}
            style={{
              display: "block",
              width: "100%",
              maxWidth: 280,
              height: 200,
              objectFit: "contain",
              marginBottom: 12,
              border: "1px solid #e7e8eb",
              borderRadius: 12,
              background: "#f8f9fb",
            }}
          />
        )}

        <input
          id="imageFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={saving}
          style={fieldStyle}
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
          }}
        />

        <small style={{ display: "block", marginTop: 8, color: "#737780" }}>
          Leave this empty to keep the current photo. JPG, PNG or WebP,
          up to 5 MB.
        </small>

        {imagePreview && (
          <img
            src={imagePreview}
            alt="New product photo preview"
            style={{
              display: "block",
              width: "100%",
              maxWidth: 280,
              maxHeight: 240,
              objectFit: "contain",
              marginTop: 12,
              border: "1px solid #e7e8eb",
              borderRadius: 12,
            }}
          />
        )}
      </div>

      {message && (
        <p role="status" style={{ color: "#353840", fontSize: 14 }}>
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
          {saving ? "Saving changes..." : "Save changes"}
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