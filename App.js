import './global.css';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-xl font-bold text-slate-900 text-center">
        Open up App.js to start working on your app!
      </Text>
      <Text className="mt-2 text-sm text-indigo-600 font-medium">
        Tailwind CSS (NativeWind) is configured and ready
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}
