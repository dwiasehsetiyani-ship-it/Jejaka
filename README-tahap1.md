# Jejaka - Tahap 1

1. Buat proyek:
   npx create-expo-app@latest jejaka --template blank-typescript
   cd jejaka
   npx expo install expo-router expo-sqlite expo-status-bar react-native-safe-area-context react-native-screens expo-linking expo-constants @react-native-async-storage/async-storage @expo/vector-icons

2. Di package.json ubah:  "main": "expo-router/entry"
3. Di app.json tambahkan di dalam "expo":  "scheme": "jejaka", "plugins": ["expo-router", "expo-sqlite"]
4. Hapus App.tsx dan index.ts bawaan.
5. Salin folder app/ dan src/ dari zip ini ke root proyek.
6. Jalankan:  npx expo start -c
