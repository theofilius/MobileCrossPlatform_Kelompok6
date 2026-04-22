import axios from "axios";

const ENV = process.env.EXPO_PUBLIC_API_URL;

export const getPosts = () => {
  return axios.get(`${ENV}posts`);
};

export const getPostDetail = (id: number) => {
  return axios.get(ENV + "posts/" + id);
};

export const getUserDetail = (Id: number) => {
  return axios.get(ENV + "users/" + Id);
};

export const getComments = (postId: number) => {
  return axios.get(ENV + "posts/" + postId + "/comments");
};

export const postData = (data: {
  title: string;
  body: string;
  userId: number;
}) => {
  return axios.post(ENV + "posts", data);
};
