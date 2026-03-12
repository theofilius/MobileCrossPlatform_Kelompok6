import { Link } from "expo-router";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Avatar, Card, Text } from "react-native-paper";
import styles from "./AppStyles";
import userData from "./data.json";

export default function UserList() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {userData.map((user, index) => (
        <Link
          key={index}
          href={{
            pathname: "/profile",
            params: {
              userName: user.name,
              email: user.email,
              photo: user.photo_url,
            },
          }}
          asChild
        >
          <TouchableOpacity>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Avatar.Image
                  size={70}
                  source={{ uri: user.photo_url }}
                />

                <View style={styles.textContainer}>
                  <Text style={styles.boldText}>{user.name}</Text>
                  <Text style={{ color: "#ccc" }}>{user.email}</Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </Link>
      ))}
    </ScrollView>
  );
}