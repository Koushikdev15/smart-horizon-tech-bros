import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Type, Spacing, BorderRadius } from '@/theme';
import { AppHeader } from '@/components/Header';
import { blogService, type BlogPost } from '@/services/blogService';

export default function BlogDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogService
      .getById(id)
      .then(setPost)
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Daily Reads" />

      {loading || !post ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Image source={{ uri: post.imageUrl }} style={styles.hero} />
          <View style={styles.content}>
            <Text style={styles.title}>{post.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{post.author}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{new Date(post.publishedAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.body}>{post.body}</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { width: '100%', height: 240, backgroundColor: Colors.surfaceVariant },
  content: { paddingHorizontal: Spacing.gutter, paddingVertical: Spacing.lg, paddingBottom: Spacing['3xl'] },
  title: { fontFamily: Fonts.family.serifSemiBold, fontSize: Fonts.size.xl, color: Colors.primary, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  metaText: { fontFamily: Fonts.family.medium, fontSize: 12, color: Colors.textMuted },
  metaDot: { color: Colors.textMuted },
  body: { fontFamily: Fonts.family.regular, fontSize: Fonts.size.sm + 1, color: Colors.text, lineHeight: 24 },
});
