import { mockPosts } from "@/constants/mockData";
import { postData } from "@/services/api";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Index() {
  const [posts, setPosts] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    getAllPosts();
  }, []);

  const getAllPosts = () => {
    // Use mock posts and limit to 5
    setPosts(mockPosts.slice(0, 5));
  };

  const handleSubmitPost = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    Keyboard.dismiss();

    postData({ title, body, userId: 1 })
      .then((res) => {
        if (res.status === 201) {
          Alert.alert("Success", "Post created successfully");

          // Add new post to the beginning of the list
          const newPost = {
            id: posts.length + 1,
            userId: 1,
            title: title,
            body: body,
          };

          setPosts([newPost, ...posts.slice(0, 4)]);
          setTitle("");
          setBody("");
          setModalVisible(false);
        }
      })
      .catch((error) => {
        Alert.alert("Error", "Failed to create post");
        console.log(error);
      });
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    setTitle("");
    setBody("");
    setModalVisible(false);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
      }}
    >
      <SafeAreaView
        style={{
          backgroundColor: "#f8f8f8",
          borderBottomWidth: 1,
          borderBottomColor: "#e0e0e0",
        }}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            alignItems: "flex-end",
          }}
        >
          <Pressable
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: "#007AFF",
              width: 50,
              height: 50,
              borderRadius: 25,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 24 }}>
              +
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 20,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 12,
                padding: 20,
                width: "85%",
                maxWidth: 420,
                maxHeight: "90%",
              }}
            >
              <View style={{ width: "100%" }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    marginBottom: 16,
                  }}
                >
                  Create New Post
                </Text>

                <Text style={{ marginBottom: 8, fontWeight: "600" }}>
                  Title
                </Text>
                <TextInput
                  placeholder="Enter post title"
                  value={title}
                  onChangeText={setTitle}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 16,
                    width: "100%",
                  }}
                  placeholderTextColor="#999"
                />

                <Text style={{ marginBottom: 8, fontWeight: "600" }}>Body</Text>
                <TextInput
                  placeholder="Enter post body"
                  value={body}
                  onChangeText={setBody}
                  multiline
                  numberOfLines={4}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 20,
                    textAlignVertical: "top",
                    width: "100%",
                  }}
                  placeholderTextColor="#999"
                />

                <View
                  style={{
                    flexDirection: "row",
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <Pressable
                    onPress={handleCancel}
                    style={{
                      backgroundColor: "#e0e0e0",
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      borderRadius: 8,
                      flex: 0.48,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 6,
                    }}
                  >
                    <Text
                      style={{ fontWeight: "600", fontSize: 14 }}
                      numberOfLines={1}
                    >
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSubmitPost}
                    style={{
                      backgroundColor: "#007AFF",
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      borderRadius: 8,
                      flex: 0.48,
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                      numberOfLines={1}
                    >
                      Submit
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        {posts.map((post) => (
          <Pressable
            key={post.id}
            onPress={() =>
              router.push({
                pathname: "/postDetail",
                params: {
                  postData: JSON.stringify(post),
                },
              })
            }
            style={{
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text
              style={{ fontWeight: "bold", marginBottom: 6, color: "#333" }}
            >
              Post Number: {post.id}
            </Text>
            <Text
              style={{
                fontWeight: "600",
                marginBottom: 8,
                fontSize: 15,
                color: "#222",
              }}
            >
              Title: {post.title}
            </Text>
            <Text style={{ color: "#555", lineHeight: 20 }}>
              Body: {post.body}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
