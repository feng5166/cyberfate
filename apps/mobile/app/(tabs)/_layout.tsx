import { Image } from "react-native";
import { Tabs } from "expo-router";

const TAB_BAR_BG = "#FAF6EE";
const ACTIVE_COLOR = "#E87722";
const INACTIVE_COLOR = "rgba(27, 37, 64, 0.5)";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: TAB_BAR_BG,
          borderTopColor: "#E8E0D0",
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "首页",
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require("../../assets/tab-icons/home-active.png")
                  : require("../../assets/tab-icons/home-default.png")
              }
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="fortune"
        options={{
          title: "运势",
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require("../../assets/tab-icons/fortune-active.png")
                  : require("../../assets/tab-icons/fortune-default.png")
              }
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chart"
        options={{
          title: "命盘",
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require("../../assets/tab-icons/chart-active.png")
                  : require("../../assets/tab-icons/chart-default.png")
              }
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="square"
        options={{
          title: "广场",
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require("../../assets/tab-icons/square-active.png")
                  : require("../../assets/tab-icons/square-default.png")
              }
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "我的",
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require("../../assets/tab-icons/profile-active.png")
                  : require("../../assets/tab-icons/profile-default.png")
              }
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
