import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Alert,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/colors";
import { useCart } from "../../lib/store";

const W = Dimensions.get("window").width;
const API_BASE = "https://flnn18fvujafwld4f6uuy-preview-4200.runable.site";

type Product = {
  id: number;
  name: string;
  desc: string;
  price: string;
  priceNum: number;
  img: string;
  tag: string;
  stock?: number;
};

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addToCart = useCart((s) => s.add);

  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/products`);
      return r.json() as Promise<{ ok: boolean; products: Product[] }>;
    },
  });

  const product = data?.products.find((p) => String(p.id) === id);

  if (isLoading || !product) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAdd = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      priceNum: product.priceNum,
      img: product.img,
    });
    Alert.alert("Добавлено в корзину", `«${product.name}»`, [
      { text: "В корзину", onPress: () => router.push("/(tabs)/cart") },
      { text: "Продолжить", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView>
        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.dark} />
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>

        {/* Image */}
        <Image
          source={{ uri: `${API_BASE}${product.img}` }}
          style={styles.img}
          contentFit="cover"
        />

        {/* Info */}
        <View style={styles.body}>
          <Text style={styles.tag}>{product.tag}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.desc}>{product.desc}</Text>

          {product.stock !== undefined && product.stock <= 3 && product.stock > 0 && (
            <Text style={styles.stockWarn}>Осталось {product.stock} шт.</Text>
          )}
          {product.stock === 0 && (
            <Text style={styles.stockOut}>Нет в наличии</Text>
          )}

          <View style={styles.footer}>
            <Text style={styles.price}>{product.price}</Text>
            <TouchableOpacity
              style={[styles.btn, product.stock === 0 && styles.btnDisabled]}
              onPress={handleAdd}
              disabled={product.stock === 0}
            >
              <Text style={styles.btnText}>В корзину</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.muted },
  back: { flexDirection: "row", alignItems: "center", gap: 6, padding: 16 },
  backText: { fontSize: 14, color: colors.dark },
  img: { width: W, height: W * 1.1 },
  body: { padding: 20 },
  tag: { fontSize: 11, color: colors.muted, letterSpacing: 1.5, marginBottom: 6 },
  name: { fontSize: 22, fontWeight: "700", color: colors.dark, marginBottom: 12 },
  desc: { fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 20 },
  stockWarn: { fontSize: 12, color: colors.clay, marginBottom: 12 },
  stockOut: { fontSize: 12, color: colors.error, marginBottom: 12, fontWeight: "600" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  price: { fontSize: 24, fontWeight: "700", color: colors.earth },
  btn: {
    backgroundColor: colors.earth,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 30,
  },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});
