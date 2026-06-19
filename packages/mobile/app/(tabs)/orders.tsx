import {
  View, Text, FlatList, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/colors";
import { useOrders, type Order } from "../../lib/store";

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  shipped: "Отправлен",
  delivered: "Доставлен",
};

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: colors.clay,
  paid: colors.success,
  shipped: "#5B87C4",
  delivered: colors.success,
};

const STATUS_ICONS: Record<Order["status"], string> = {
  pending: "time-outline",
  paid: "checkmark-circle-outline",
  shipped: "car-outline",
  delivered: "home-outline",
};

export default function OrdersScreen() {
  const orders = useOrders((s) => s.orders);

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Мои заказы</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={64} color={colors.border} />
          <Text style={styles.emptyText}>Заказов пока нет</Text>
          <Text style={styles.emptySubText}>После оплаты заказы появятся здесь</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Мои заказы</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: Order }) => (
          <View style={styles.card}>
            {/* Status */}
            <View style={styles.statusRow}>
              <Ionicons
                name={STATUS_ICONS[item.status] as any}
                size={20}
                color={STATUS_COLORS[item.status]}
              />
              <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                {STATUS_LABELS[item.status]}
              </Text>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              {(["pending", "paid", "shipped", "delivered"] as Order["status"][]).map((s, i, arr) => {
                const currentIdx = arr.indexOf(item.status);
                const done = i <= currentIdx;
                return (
                  <View key={s} style={styles.progressStep}>
                    <View style={[styles.progressDot, done && styles.progressDotDone]} />
                    {i < arr.length - 1 && (
                      <View style={[styles.progressLine, done && i < currentIdx && styles.progressLineDone]} />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Items */}
            <View style={styles.items}>
              {item.items.map((p) => (
                <View key={p.id} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.itemQty}>× {p.qty}</Text>
                  <Text style={styles.itemPrice}>{(p.priceNum * p.qty).toLocaleString("ru-RU")} ₽</Text>
                </View>
              ))}
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Итого</Text>
              <Text style={styles.totalValue}>{item.total.toLocaleString("ru-RU")} ₽</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.dark, letterSpacing: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 18, fontWeight: "600", color: colors.dark },
  emptySubText: { fontSize: 13, color: colors.muted },
  list: { padding: 16, gap: 16 },
  card: {
    backgroundColor: colors.white, borderRadius: 12, padding: 16,
    shadowColor: colors.dark, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    gap: 12,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusText: { fontWeight: "600", fontSize: 13, flex: 1 },
  dateText: { fontSize: 12, color: colors.muted },
  progressTrack: { flexDirection: "row", alignItems: "center" },
  progressStep: { flexDirection: "row", alignItems: "center", flex: 1 },
  progressDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.border,
  },
  progressDotDone: { backgroundColor: colors.earth },
  progressLine: { flex: 1, height: 2, backgroundColor: colors.border },
  progressLineDone: { backgroundColor: colors.earth },
  items: { gap: 6 },
  itemRow: { flexDirection: "row", alignItems: "center" },
  itemName: { flex: 1, fontSize: 13, color: colors.dark },
  itemQty: { fontSize: 13, color: colors.muted, marginHorizontal: 8 },
  itemPrice: { fontSize: 13, fontWeight: "600", color: colors.earth },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10,
  },
  totalLabel: { fontSize: 14, color: colors.muted },
  totalValue: { fontSize: 16, fontWeight: "700", color: colors.dark },
});
