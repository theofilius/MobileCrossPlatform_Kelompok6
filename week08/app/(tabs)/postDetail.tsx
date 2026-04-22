import { mockComments } from "@/constants/mockData";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function PostDetail() {
  const { postData } = useLocalSearchParams<{ postData: string }>();

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    if (postData) {
      try {
        const parsedPost = JSON.parse(postData);
        setPost(parsedPost);
        getCommentsData(parsedPost.id);
      } catch (error) {
        console.log("Error parsing post data:", error);
      }
    }
  }, [postData]);

  const getCommentsData = (postId: number) => {
    const postComments =
      mockComments[postId as keyof typeof mockComments] || [];
    setComments(postComments);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f9f9f9",
      }}
    >
      <ScrollView
        style={{
          paddingHorizontal: 16,
          paddingVertical: 20,
          backgroundColor: "#fff",
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#e0e0e0",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: 18,
              marginBottom: 12,
              color: "#222",
            }}
          >
            {post?.title}
          </Text>
          <Text
            style={{
              textAlign: "center",
              marginBottom: 12,
              color: "#555",
              lineHeight: 20,
            }}
          >
            {post?.body}
          </Text>
          <View
            style={{
              height: 1,
              backgroundColor: "#e0e0e0",
              marginVertical: 12,
            }}
          />
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 16,
              marginBottom: 12,
              color: "#222",
            }}
          >
            Comments ({comments.length})
          </Text>

          {comments.length === 0 ? (
            <Text style={{ color: "#999", fontStyle: "italic" }}>
              No comments yet
            </Text>
          ) : (
            comments.map((comment) => (
              <View
                key={comment.id}
                style={{
                  backgroundColor: "white",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                  borderLeftWidth: 4,
                  borderLeftColor: "#007AFF",
                }}
              >
                <Text
                  style={{ fontWeight: "bold", marginBottom: 4, color: "#222" }}
                >
                  {comment.name}
                </Text>
                <Text style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                  {comment.email}
                </Text>
                <Text style={{ color: "#555", lineHeight: 18 }}>
                  {comment.body}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
