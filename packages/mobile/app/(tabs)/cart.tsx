import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, Linking,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/colors";
import { useCart, useOrders, type CartItem, type Order } from "../../lib/store";

const API_BASE = "https://flnn18fvujafwld4f6uuy-preview-4200.runable.site";

export default function CartScreen() {
  const { items, remove, inc, dec, clear, total } = useCart();
  const addOrder = useOrders((s) => s.addOrder);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    Alert.alert(
      "Оформление заказа",
      `Итого: ${total().toLocaleString("ru-RU")} ₽\n\nПродолжить к оплате?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Оплатить",
          onPress: async () => {
            try {
              const r = await fetch(`${API_BASE}/api/payment/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: items.map((i) => ({
                    name: i.name,
                    price: i.priceNum,
                    qty: i.qty,
                  })),
                  totalAmount: total(),
                }),
              });
              const data = await r.json() as { ok: boolean; confirmationUrl?: string; orderId?: string };

              if (data.ok && data.confirmationUrl) {
                // Save order locally
                const order: Order = {
                  id: data.orderId ?? Date.now().toString(),
                  date: new Date().toLocaleDateString("ru-RU"),
                  status: "pending",
                  items: [...items],
                  total: total(),
                };
                addOrder(order);
                clear();
                await Linking.openURL(data.confirmationUrl);
              } else {
                Alert.alert("Ошибка", "Не удалось создать платёж");
              }
            } catch {
              Alert.alert("Ошибка", "Проблема с соединением");
            }
          },
        },
      ]
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Корзина</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="bag-outline" size={64} color={colors.border} />
          <Text style={styles.emptyText}>Корзина пуста</Text>
          <Text style={styles.emptySubText}>Добавьте товары из каталога</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Корзина</Text>
        <TouchableOpacity onPress={() => Alert.alert("Очистить?", "", [
          { text: "Нет", style: "cancel" },
          { text: "Да", onPress: clear },
        ])}>
          <Text style={styles.clearBtn}>Очистить</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: CartItem }) => (
          <View style={styles.card}>
            <Image
              source={{ uri: `${API_BASE}${item.img}` }}
              style={styles.cardImg}
              contentFit="cover"
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.cardPrice}>{item.price}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => dec(item.id)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{item.qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => inc(item.id)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.lineTotal}>{(item.priceNum * item.qty).toLocaleString("ru-RU")} ₽</Text>
              <TouchableOpacity onPress={() => remove(item.id)} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Итого:</Text>
              <Text style={styles.totalValue}>{total().toLocaleString("ru-RU")} ₽</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Перейти к оплате</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.dark, letterSpacing: 1 },
  clearBtn: { fontSize: 13, color: colors.error },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 18, fontWeight: "600", color: colors.dark },
  emptySubText: { fontSize: 13, color: colors.muted },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: "row", backgroundColor: colors.white,
    borderRadius: 12, overflow: "hidden",
    shadowColor: colors.dark, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardImg: { width: 90, height: 90 },
  cardInfo: { flex: 1, padding: 10 },
  cardName: { fontSize: 13, fontWeight: "600", color: colors.dark, marginBottom: 4 },
  cardPrice: { fontSize: 12, color: colors.muted, marginBottom: 8 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  qtyBtnText: { fontSize: 16, color: colors.dark, lineHeight: 20 },
  qtyNum: { fontSize: 15, fontWeight: "600", color: colors.dark, minWidth: 20, textAlign: "center" },
  cardRight: { padding: 10, alignItems: "flex-end", justifyContent: "space-between" },
  lineTotal: { fontSize: 14, fontWeight: "700", color: colors.earth },
  removeBtn: { padding: 4 },
  footer: { padding: 20, gap: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, color: colors.muted },
  totalValue: { fontSize: 22, fontWeight: "700", color: colors.dark },
  checkoutBtn: {
    backgroundColor: colors.earth, borderRadius: 30,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16,
  },
  checkoutText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});
