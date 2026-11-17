module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-worklets/plugin', // <-- Changed from 'react-native-reanimated/plugin'
  ],
};