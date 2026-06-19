import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, Switch, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors } from "../../lib/colors";
import { useAdmin } from "../../lib/store";

const API_BASE = "https://flnn18fvujafwld4f6uuy-preview-4200.runable.site";

type Product = {
  id: number;
  name: string;
  price: string;
  priceNum: number;
  img: string;
  tag: string;
  desc: string;
  stock?: number;
  hidden?: boolean;
};

// ─── Login screen ──────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json() as { ok: boolean; token?: string; error?: string };
      if (data.ok && data.token) {
        onLogin(data.token);
      } else {
        Alert.alert("Ошибка", data.error ?? "Неверный пароль");
      }
    } catch {
      Alert.alert("Ошибка", "Нет соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.loginWrap}>
        <Ionicons name="settings-outline" size={48} color={colors.earth} />
        <Text style={styles.loginTitle}>Панель управления</Text>
        <Text style={styles.loginSub}>Только для администратора</Text>
        <TextInput
          style={styles.input}
          placeholder="Пароль"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginBtnText}>{loading ? "Вход..." : "Войти"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Edit modal ─────────────────────────────────────────────────────────────
function EditModal({
  product,
  token,
  onClose,
}: {
  product: Product | null;
  token: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(String(product?.priceNum ?? ""));
  const [stock, setStock] = useState(String(product?.stock ?? ""));
  const [tag, setTag] = useState(product?.tag ?? "");
  const [desc, setDesc] = useState(product?.desc ?? "");
  const [img, setImg] = useState(product?.img ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const priceNum = Number(price);
      const body = {
        name,
        priceNum,
        price: `${priceNum.toLocaleString("ru-RU")} ₽`,
        stock: stock ? Number(stock) : undefined,
        tag,
        desc,
        img: img || "/item-pause.jpg",
      };
      const url = product
        ? `${API_BASE}/api/admin/products/${product.id}`
        : `${API_BASE}/api/admin/products`;
      const method = product ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: () => Alert.alert("Ошибка", "Не удалось сохранить"),
  });

  return (
    <View style={styles.modalOverlay}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{product ? "Редактировать" : "Добавить товар"}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.dark} />
            </TouchableOpacity>
          </View>

          {[
            { label: "Название", value: name, set: setName },
            { label: "Цена (₽)", value: price, set: setPrice, keyboard: "numeric" },
            { label: "Остаток (шт.)", value: stock, set: setStock, keyboard: "numeric" },
            { label: "Категория (тег)", value: tag, set: setTag },
            { label: "Путь к фото (напр. /item-pause.jpg)", value: img, set: setImg },
          ].map(({ label, value, set, keyboard }) => (
            <View key={label} style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={set}
                keyboardType={(keyboard as any) ?? "default"}
                placeholderTextColor={colors.muted}
              />
            </View>
          ))}

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Описание</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={desc}
              onChangeText={setDesc}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.muted}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, save.isPending && styles.loginBtnDisabled]}
            onPress={() => save.mutate()}
            disabled={save.isPending}
          >
            <Text style={styles.saveBtnText}>{save.isPending ? "Сохранение..." : "Сохранить"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Main admin screen ─────────────────────────────────────────────────────
export default function AdminScreen() {
  const { token, setToken } = useAdmin();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null | "new">(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    enabled: !!token,
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return r.json() as Promise<{ ok: boolean; products: Product[] }>;
    },
  });

  const toggleHide = useMutation({
    mutationFn: async ({ id, hidden }: { id: number; hidden: boolean }) => {
      await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hidden }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleDelete = (p: Product) => {
    Alert.alert("Удалить товар?", p.name, [
      { text: "Нет", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: () => deleteProduct.mutate(p.id) },
    ]);
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <LoginScreen onLogin={setToken} />
      </SafeAreaView>
    );
  }

  const products = data?.products ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Товары ({products.length})</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setEditing("new")}>
            <Ionicons name="add" size={20} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setToken(null); }}>
            <Ionicons name="log-out-outline" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: Product }) => (
            <View style={styles.card}>
              <View style={styles.cardMain}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardMeta}>{item.price} · {item.tag}</Text>
                  {item.stock !== undefined && (
                    <Text style={[styles.cardStock, item.stock === 0 && { color: colors.error }]}>
                      Остаток: {item.stock} шт.
                    </Text>
                  )}
                </View>
                <Switch
                  value={!item.hidden}
                  onValueChange={(v) => toggleHide.mutate({ id: item.id, hidden: !v })}
                  trackColor={{ false: colors.border, true: colors.earth }}
                  thumbColor={colors.white}
                />
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setEditing(item)}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.earth} />
                  <Text style={styles.actionText}>Редактировать</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Удалить</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Edit modal */}
      {editing !== null && (
        <EditModal
          product={editing === "new" ? null : editing}
          token={token}
          onClose={() => setEditing(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  loginWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32, gap: 16,
  },
  loginTitle: { fontSize: 22, fontWeight: "700", color: colors.dark, letterSpacing: 1 },
  loginSub: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  input: {
    width: "100%",
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.dark,
  },
  loginBtn: {
    width: "100%", backgroundColor: colors.earth,
    borderRadius: 30, paddingVertical: 14, alignItems: "center",
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.dark },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.earth, alignItems: "center", justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.muted },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.white, borderRadius: 12, padding: 14,
    shadowColor: colors.dark, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardMain: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  cardName: { fontSize: 14, fontWeight: "700", color: colors.dark },
  cardMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  cardStock: { fontSize: 12, color: colors.clay, marginTop: 2 },
  cardActions: {
    flexDirection: "row", gap: 8,
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  deleteBtn: { borderColor: colors.error + "40" },
  actionText: { fontSize: 13, color: colors.earth, fontWeight: "600" },
  modalOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end", alignItems: "center",
  },
  modalScroll: { backgroundColor: colors.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20, width: "100%" },
  modal: { padding: 24, gap: 12, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.dark },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: 12, color: colors.muted, letterSpacing: 0.5 },
  textarea: { height: 80, textAlignVertical: "top" },
  saveBtn: {
    backgroundColor: colors.earth, borderRadius: 30,
    paddingVertical: 14, alignItems: "center", marginTop: 8,
  },
  saveBtnText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
