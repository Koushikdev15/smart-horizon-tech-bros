import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { forumService, type ForumPost, type ForumComment } from '@/services/forumService';
import { formatRelativeTime } from '@/lib/formatRelativeTime';

export default function ForumPostDetailScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([forumService.getPost(postId), forumService.listComments(postId)]);
      setPost(p);
      setComments(c);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [postId]);

  async function handleToggleLike() {
    if (!post) return;
    const wasLiked = post.likedByMe;
    setPost({ ...post, likedByMe: !wasLiked, likeCount: post.likeCount + (wasLiked ? -1 : 1) });
    try {
      await forumService.toggleLike(post.id, wasLiked);
    } catch {
      load();
    }
  }

  async function handleSendComment() {
    const text = commentText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await forumService.addComment(postId, text);
      setCommentText('');
      const c = await forumService.listComments(postId);
      setComments(c);
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title={post?.postType === 'thought' ? 'Thought' : 'Question'} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {loading || !post ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.headerRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{post.authorName.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.authorName}>{post.authorName}</Text>
                  <Text style={styles.timeAgo}>{formatRelativeTime(post.createdAt)}</Text>
                </View>
              </View>

              <Text style={styles.title}>{post.title}</Text>
              <Text style={styles.body}>{post.body}</Text>

              {post.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.postImage} />}

              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.footerBtn} onPress={handleToggleLike}>
                  <Icon name={post.likedByMe ? 'heart' : 'heart-outline'} size={19} color={post.likedByMe ? Colors.error : Colors.textMuted} />
                  <Text style={styles.footerBtnText}>{post.likeCount} Like{post.likeCount === 1 ? '' : 's'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.commentsHeading}>
                {comments.length > 0 ? `${comments.length} Comment${comments.length > 1 ? 's' : ''}` : 'No Comments Yet.'}
              </Text>

              {comments.map((c) => (
                <View key={c.id} style={[styles.commentCard, Shadow.sm]}>
                  <View style={styles.commentHeaderRow}>
                    <View style={styles.avatarCircleSm}>
                      <Text style={styles.avatarInitialSm}>{c.authorName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.commentAuthor}>{c.authorName}</Text>
                    <Text style={styles.timeAgo}>{formatRelativeTime(c.createdAt)}</Text>
                  </View>
                  <Text style={styles.commentBody}>{c.body}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.inputBar}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add your comment"
                placeholderTextColor={Colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!commentText.trim() || sending) && styles.sendBtnDisabled]}
                onPress={handleSendComment}
                disabled={!commentText.trim() || sending}
              >
                <Icon name="send" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.gutter, paddingVertical: Spacing.md, paddingBottom: Spacing['3xl'] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: Fonts.family.bold, fontSize: 16, color: Colors.onSecondaryContainer },
  authorName: { fontFamily: Fonts.family.semiBold, fontSize: 14, color: Colors.onSurface },
  timeAgo: { fontFamily: Fonts.family.regular, fontSize: 11, color: Colors.textMuted },
  title: { fontFamily: Fonts.family.serifSemiBold, fontSize: Fonts.size.lg, color: Colors.primary, marginBottom: Spacing.sm },
  body: { fontFamily: Fonts.family.regular, fontSize: Fonts.size.sm + 1, color: Colors.text, lineHeight: 22 },
  postImage: { width: '100%', height: 220, borderRadius: BorderRadius.xl, marginTop: Spacing.md, backgroundColor: Colors.surfaceVariant },
  footerRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerBtnText: { fontFamily: Fonts.family.medium, fontSize: 13, color: Colors.textMuted },
  commentsHeading: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.sm, color: Colors.secondary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  commentCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  commentHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  avatarCircleSm: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialSm: { fontFamily: Fonts.family.bold, fontSize: 10, color: Colors.onSecondaryContainer },
  commentAuthor: { fontFamily: Fonts.family.semiBold, fontSize: 12, color: Colors.onSurface, flex: 1 },
  commentBody: { fontFamily: Fonts.family.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  commentInput: {
    flex: 1,
    height: 42,
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.text,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
