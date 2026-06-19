import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/colors";

const CONTACTS = [
  {
    icon: "logo-instagram",
    label: "Instagram",
    value: "@nikolos.ceramic",
    url: "https://instagram.com/nikolos.ceramic",
  },
  {
    icon: "logo-vk",
    label: "ВКонтакте",
    value: "vk.com/nikolos",
    url: "https://vk.com/nikolos",
  },
  {
    icon: "mail-outline",
    label: "Email",
    value: "hello@nikolos.ru",
    url: "mailto:hello@nikolos.ru",
  },
  {
    icon: "logo-whatsapp",
    label: "WhatsApp",
    value: "+7 (900) 000-00-00",
    url: "https://wa.me/79000000000",
  },
];

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>NIKOLOS</Text>
          <Text style={styles.sub}>ручная керамика</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Story */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>О мастерской</Text>
          <Text style={styles.body}>
            Мы создаём авторскую керамику вручную — каждое изделие уникально и несёт в себе тепло человеческих рук. Наши работы — это стаканы, кружки, пиалы, тарелки, свечники и украшения.
          </Text>
          <Text style={styles.body}>
            Используем только натуральные глазури и экологичные материалы. Обжиг происходит в нашей мастерской при высоких температурах — это делает изделия прочными и безопасными для пищевых продуктов.
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Наши ценности</Text>
          {[
            ["Ручная работа", "Каждое изделие лепится, декорируется и обжигается вручную"],
            ["Натуральные материалы", "Только экологичные глазури и природные пигменты"],
            ["Уникальность", "Не бывает двух одинаковых изделий — каждое особенное"],
            ["Доставка по России", "Надёжно упакуем и отправим в любой город"],
          ].map(([title, desc]) => (
            <View key={title} style={styles.valueRow}>
              <View style={styles.valueDot} />
              <View style={styles.valueText}>
                <Text style={styles.valueTitle}>{title}</Text>
                <Text style={styles.valueDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Контакты</Text>
          {CONTACTS.map((c) => (
            <TouchableOpacity
              key={c.label}
              style={styles.contactRow}
              onPress={() => Linking.openURL(c.url)}
            >
              <View style={styles.contactIcon}>
                <Ionicons name={c.icon as any} size={20} color={colors.earth} />
              </View>
              <View>
                <Text style={styles.contactLabel}>{c.label}</Text>
                <Text style={styles.contactValue}>{c.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.border} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footer}>© 2025 Nikolos Ceramic</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", paddingVertical: 20 },
  logo: { fontSize: 24, fontWeight: "700", letterSpacing: 6, color: colors.dark },
  sub: { fontSize: 11, color: colors.muted, letterSpacing: 2, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.dark, letterSpacing: 0.5 },
  body: { fontSize: 14, color: colors.muted, lineHeight: 22 },
  valueRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  valueDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.earth, marginTop: 6 },
  valueText: { flex: 1 },
  valueTitle: { fontSize: 14, fontWeight: "600", color: colors.dark },
  valueDesc: { fontSize: 13, color: colors.muted, marginTop: 2 },
  contactRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: colors.white, borderRadius: 12,
    padding: 14,
    shadowColor: colors.dark, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  contactIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.sand,
    alignItems: "center", justifyContent: "center",
  },
  contactLabel: { fontSize: 11, color: colors.muted },
  contactValue: { fontSize: 14, fontWeight: "600", color: colors.dark },
  footer: { textAlign: "center", fontSize: 11, color: colors.border, marginTop: 32 },
});
