import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { GuestGate } from '@/components/GuestGate';
import { forumService, type ForumPost, type ForumPostType } from '@/services/forumService';
import { formatRelativeTime } from '@/lib/formatRelativeTime';

const SUGGESTED_QUESTIONS = [
  "What's the best Ayurvedic remedy for seasonal allergies?",
  'Can Ashwagandha be taken alongside blood pressure medication?',
  'How long does it typically take to see results from Triphala for digestion?',
  'Is it safe to take Ayurvedic supplements during pregnancy?',
  "What's the difference between Chyawanprash brands — does the AYUSH mark matter?",
];

const SUGGESTED_THOUGHTS = [
  "Switched to a Dinacharya (daily routine) a month ago — sharing what actually stuck and what didn't.",
  "My family has used Ayurveda for generations — here's what I wish I'd known earlier about sourcing genuine products.",
  'Tried an Ayurvedic diet reset this monsoon season — my honest experience.',
  'Blockchain verification changed how I shop for herbal products. Here is why.',
  'Ayurveda plus modern medicine: how I balance both for a chronic condition.',
];

function PostCard({ post, onPress, onToggleLike }: { post: ForumPost; onPress: () => void; onToggleLike: () => void }) {
  return (
    <TouchableOpacity style={[styles.card, Shadow.sm]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{post.authorName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <Text style={styles.timeAgo}>{formatRelativeTime(post.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.postTitle} numberOfLines={1}>
        {post.postType === 'question' ? 'Question: ' : 'Thought: '}
        {post.title}
      </Text>
      <Text style={styles.postBody} numberOfLines={2}>{post.body}</Text>

      {post.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.postImage} />}

      <Text style={styles.answersText}>
        {post.commentCount > 0 ? `${post.commentCount} ${post.postType === 'question' ? 'Answer' : 'Comment'}${post.commentCount > 1 ? 's' : ''}` : 'No Answers Yet'}
      </Text>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.footerBtn} onPress={onToggleLike}>
          <Icon name={post.likedByMe ? 'heart' : 'heart-outline'} size={17} color={post.likedByMe ? Colors.error : Colors.textMuted} />
          <Text style={styles.footerBtnText}>{post.likeCount} Like{post.likeCount === 1 ? '' : 's'}</Text>
        </TouchableOpacity>
        <View style={styles.footerBtn}>
          <Icon name="chatbubble-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.footerBtnText}>{post.commentCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ForumScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<ForumPostType>('question');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await forumService.listPosts(tab);
      setPosts(results);
    } catch {
      setError('Could not load the forum.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleToggleLike(post: ForumPost) {
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) } : p))
    );
    try {
      await forumService.toggleLike(post.id, post.likedByMe);
    } catch {
      load();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Forum" />

      <GuestGate message="Sign in to ask questions and join the AyurTrace+ community.">
        <View style={styles.segmentRow}>
          <TouchableOpacity style={[styles.segment, tab === 'question' && styles.segmentActive]} onPress={() => setTab('question')}>
            <Text style={[styles.segmentText, tab === 'question' && styles.segmentTextActive]}>Questions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segment, tab === 'thought' && styles.segmentActive]} onPress={() => setTab('thought')}>
            <Text style={[styles.segmentText, tab === 'thought' && styles.segmentTextActive]}>Thoughts</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyScroll}>
            <Icon name="chatbubbles-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              No {tab === 'question' ? 'questions' : 'thoughts'} yet — be the first to post.
            </Text>
            <Text style={styles.suggestedHeading}>Need an idea? Tap one to get started</Text>
            <View style={styles.suggestedGrid}>
              {(tab === 'question' ? SUGGESTED_QUESTIONS : SUGGESTED_THOUGHTS).map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  style={styles.suggestedChip}
                  onPress={() => router.push({ pathname: '/forum/new', params: { postType: tab, suggestedTitle: prompt } } as any)}
                >
                  <Text style={styles.suggestedChipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onPress={() => router.push(`/forum/${item.id}` as any)}
                onToggleLike={() => handleToggleLike(item)}
              />
            )}
          />
        )}

        <TouchableOpacity style={[styles.fab, Shadow.lg]} onPress={() => router.push({ pathname: '/forum/new', params: { postType: tab } } as any)}>
          <Icon name="add" size={26} color={Colors.onPrimary} />
        </TouchableOpacity>
      </GuestGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.gutter,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: BorderRadius.full },
  segmentActive: { backgroundColor: Colors.primary },
  segmentText: { ...Type.labelMd, fontSize: 13, color: Colors.onSurfaceVariant },
  segmentTextActive: { color: Colors.onPrimary },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  emptyScroll: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing['2xl'], gap: Spacing.sm },
  emptyText: { ...Type.bodySm, color: Colors.textMuted, textAlign: 'center' },
  suggestedHeading: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  suggestedGrid: { gap: Spacing.sm, width: '100%' },
  suggestedChip: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  suggestedChipText: { fontFamily: Fonts.family.medium, fontSize: Fonts.size.sm, color: Colors.primary, lineHeight: 19 },
  listContent: { paddingHorizontal: Spacing.gutter, paddingBottom: Spacing['4xl'] },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: Fonts.family.bold, fontSize: 14, color: Colors.onSecondaryContainer },
  authorName: { fontFamily: Fonts.family.semiBold, fontSize: 13, color: Colors.onSurface },
  timeAgo: { fontFamily: Fonts.family.regular, fontSize: 11, color: Colors.textMuted },
  postTitle: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.sm + 1, color: Colors.text, marginBottom: 2 },
  postBody: { fontFamily: Fonts.family.regular, fontSize: Fonts.size.sm, color: Colors.textSecondary, lineHeight: 19 },
  postImage: { width: '100%', height: 160, borderRadius: BorderRadius.lg, marginTop: Spacing.sm, backgroundColor: Colors.surfaceVariant },
  answersText: { fontFamily: Fonts.family.semiBold, fontSize: 12, color: Colors.secondary, marginTop: Spacing.sm },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerBtnText: { fontFamily: Fonts.family.medium, fontSize: 12, color: Colors.textMuted },
  fab: {
    position: 'absolute',
    right: Spacing.gutter,
    bottom: Spacing.xl,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
