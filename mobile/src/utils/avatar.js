const defaultAvatarImg = require('../../assets/default_avatar.png');

export const getAvatarSource = (uri) => {
  if (!uri || uri === 'default' || uri === 'DEFAULT_AVATAR' || (typeof uri === 'string' && uri.includes('placeholder'))) {
    return defaultAvatarImg;
  }
  return { uri };
};
