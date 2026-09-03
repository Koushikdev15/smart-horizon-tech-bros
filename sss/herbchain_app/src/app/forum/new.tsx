import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, Type, Spacing, BorderRadius } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { PrimaryButton } from '@/components/Buttons';
import { forumService, type ForumPostType } from '@/services/forumService';

export default function NewForumPostScreen() {
  const router = useRouter();
  const { postType: initialType, suggestedTitle } = useLocalSearchParams<{ postType?: string; suggestedTitle?: string }>();
  const [postType, setPostType] = useState<ForumPostType>(initialType === 'thought' ? 'thought' : 'question');
  const [title, setTitle] = useState(suggestedTitle ?? '');
  const [body, setBody] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    setImageUri(picked.assets[0].uri);
  }

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) {
      setError('Add a title and a description.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let imageUrl: string | undefined;
      if (imageUri) imageUrl = await forumService.uploadImage(imageUri);
      await forumService.createPost({ postType, title: title.trim(), body: body.trim(), imageUrl });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="New Post" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, postType === 'question' && styles.typeBtnActive]}
            onPress={() => setPostType('question')}
          >
            <Text style={[styles.typeBtnText, postType === 'question' && styles.typeBtnTextActive]}>Question</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, postType === 'thought' && styles.typeBtnActive]}
            onPress={() => setPostType('thought')}
          >
            <Text style={[styles.typeBtnText, postType === 'thought' && styles.typeBtnTextActive]}>Thought</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={postType === 'question' ? 'What do you want to ask?' : 'Give your thought a title'}
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>{postType === 'question' ? 'Details' : 'Share more'}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={body}
          onChangeText={setBody}
          placeholder="Write here..."
          placeholderTextColor={Colors.textMuted}
          multiline
        />

        {imageUri ? (
          <View style={styles.imagePreviewWrap}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
              <Icon name="close" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
            <Icon name="image-outline" size={20} color={Colors.primary} />
            <Text style={styles.addImageBtnText}>Add a photo (optional)</Text>
          </TouchableOpacity>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          title={submitting ? 'Posting…' : 'Post'}
          onPress={handleSubmit}
          loading={submitting}
          size="lg"
          style={{ marginTop: Spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingHorizontal: Spacing.gutter, paddingVertical: Spacing.lg, paddingBottom: Spacing['3xl'] },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.sm, color: Colors.onSurfaceVariant },
  typeBtnTextActive: { color: Colors.onPrimary },
  label: { fontFamily: Fonts.family.medium, fontSize: Fonts.size.sm, color: Colors.text, marginBottom: 6, marginTop: Spacing.md },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm + 1,
    color: Colors.text,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  addImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  addImageBtnText: { fontFamily: Fonts.family.medium, fontSize: Fonts.size.sm, color: Colors.primary },
  imagePreviewWrap: { marginTop: Spacing.md, position: 'relative' },
  imagePreview: { width: '100%', height: 180, borderRadius: BorderRadius.lg, backgroundColor: Colors.surfaceVariant },
  removeImageBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { ...Type.bodySm, color: Colors.error, marginTop: Spacing.md },
});
