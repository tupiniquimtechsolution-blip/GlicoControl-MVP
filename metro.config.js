// expo-sqlite no web carrega um worker com .wasm (wa-sqlite): precisa resolver como asset.
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
config.resolver.assetExts = [...config.resolver.assetExts.filter(e => e !== 'wasm'), 'wasm']

module.exports = config
