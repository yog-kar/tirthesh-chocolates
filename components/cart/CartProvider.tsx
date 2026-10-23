
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartProduct = {
  id: string;
  slug: string;
  business: "TIRTHESH_CHOCOLATES" | "JAYANAND_FOODS";
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
};

export type CartItem = CartProduct & {
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  addToCart: (product: CartProduct, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "tirthesh-shopping-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setItems(
            parsed.filter(
              (item): item is CartItem =>
                item !== null &&
                typeof item === "object" &&
                typeof item.id === "string" &&
                typeof item.slug === "string" &&
                typeof item.name === "string" &&
                typeof item.price === "number" &&
                Number.isFinite(item.price) &&
                item.price >= 0 &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0 &&
                Number.isInteger(item.stock) &&
                item.stock > 0 &&
                (item.business === "TIRTHESH_CHOCOLATES" ||
                  item.business === "JAYANAND_FOODS") &&
                (typeof item.imageUrl === "string" ||
                  item.imageUrl === null),
            ).map((item: CartItem) => ({
              ...item,
              quantity: Math.min(item.quantity, item.stock),
            })),
          );
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  const addToCart = useCallback(
    (product: CartProduct, quantity = 1) => {
      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        product.stock < 1
      ) {
        return;
      }

      setItems((current) => {
        const existing = current.find((item) => item.id === product.id);

        if (existing) {
          return current.map((item) =>
            item.id === product.id
              ? {
                  ...product,
                  quantity: Math.min(
                    item.quantity + quantity,
                    product.stock,
                  ),
                }
              : item,
          );
        }

        return [
          ...current,
          { ...product, quantity: Math.min(quantity, product.stock) },
        ];
      });
    },
    [],
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) =>
      current.flatMap((item) => {
        if (item.id !== id) return [item];
        if (!Number.isInteger(quantity) || quantity < 1) return [];

        return [{
          ...item,
          quantity: Math.min(quantity, item.stock),
        }];
      }),
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      hydrated,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      hydrated,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}
