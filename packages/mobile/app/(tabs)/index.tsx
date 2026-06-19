import {
  View, Text, ScrollView, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
  Dimensions, Alert,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "expo-router";
import { colors } from "../../lib/colors";
import { useCart } from "../../lib/store";
import { api } from "../../lib/api";

const W = Dimensions.get("window").width;
const CARD_W = (W - 48) / 2;

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

const API_BASE = "https://flnn18fvujafwld4f6uuy-preview-4200.runable.site";

export default function CatalogScreen() {
  const router = useRouter();
  const [activeTag, setActiveTag] = useState("Все");
  const addToCart = useCart((s) => s.add);

  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/products`);
      return r.json() as Promise<{ ok: boolean; products: Product[] }>;
    },
  });

  const products = data?.products ?? [];
  const tags = ["Все", ...Array.from(new Set(products.map((p) => p.tag)))];
  const filtered =
    activeTag === "Все" ? products : products.filter((p) => p.tag === activeTag);

  const handleAdd = (p: Product) => {
    addToCart({ id: p.id, name: p.name, price: p.price, priceNum: p.priceNum, img: p.img });
    Alert.alert("", `«${p.name}» добавлен в корзину`, [{ text: "OK" }]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>NIKOLOS</Text>
        <Text style={styles.subtitle}>ручная керамика</Text>
      </View>

      {/* Tags */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsScroll}
        contentContainerStyle={styles.tagsContent}
      >
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag}
            onPress={() => setActiveTag(tag)}
            style={[styles.tag, activeTag === tag && styles.tagActive]}
          >
            <Text style={[styles.tagText, activeTag === tag && styles.tagTextActive]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.earth} />
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(`/product/${item.id}`)}
            >
              <Image
                source={{ uri: `${API_BASE}${item.img}` }}
                style={styles.cardImg}
                contentFit="cover"
              />
              <View style={styles.cardBody}>
                <Text style={styles.cardTag}>{item.tag}</Text>
                <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>{item.price}</Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAdd(item)}
                  >
                    <Text style={styles.addBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { alignItems: "center", paddingTop: 16, paddingBottom: 8 },
  logo: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 6,
    color: colors.dark,
  },
  subtitle: { fontSize: 11, color: colors.muted, letterSpacing: 2, marginTop: 2 },
  tagsScroll: { flexGrow: 0, marginBottom: 8 },
  tagsContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  tagActive: { backgroundColor: colors.earth, borderColor: colors.earth },
  tagText: { fontSize: 12, color: colors.muted },
  tagTextActive: { color: colors.white, fontWeight: "600" },
  grid: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { justifyContent: "space-between", marginBottom: 16 },
  card: {
    width: CARD_W,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: colors.dark,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardImg: { width: CARD_W, height: CARD_W * 1.1 },
  cardBody: { padding: 10 },
  cardTag: { fontSize: 10, color: colors.muted, letterSpacing: 1, marginBottom: 3 },
  cardName: { fontSize: 13, fontWeight: "600", color: colors.dark, marginBottom: 8, lineHeight: 18 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardPrice: { fontSize: 14, fontWeight: "700", color: colors.earth },
  addBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.earth,
    alignItems: "center", justifyContent: "center",
  },
  addBtnText: { color: colors.white, fontSize: 18, lineHeight: 22, marginTop: -1 },
});
