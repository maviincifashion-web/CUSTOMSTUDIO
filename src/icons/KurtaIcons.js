// src/icons/KurtaIcons.js
import React from 'react';
import { Image } from 'react-native';

// --- IMPORTS (Ensure these match your actual folder structure) ---
import LenLong from '../../assets/images/style_icons/kurta/len_long.png';
import LenShort from '../../assets/images/style_icons/kurta/len_short.png';
import CutRound from '../../assets/images/style_icons/kurta/cut_round.png';
import CutStraight from '../../assets/images/style_icons/kurta/cut_straight.png';
import PlacketNotch from '../../assets/images/style_icons/kurta/placket_notch.png';
import PlacketSquare from '../../assets/images/style_icons/kurta/placket_square.png';
import Pocket0 from '../../assets/images/style_icons/kurta/pocket_0.png';
import Pocket1 from '../../assets/images/style_icons/kurta/pocket_1.png';
import Pocket2 from '../../assets/images/style_icons/kurta/pocket_2.png';
import Flap0 from '../../assets/images/style_icons/kurta/flap_0.png';
import Flap1 from '../../assets/images/style_icons/kurta/flap_1.png';
import TypeRound from '../../assets/images/style_icons/kurta/type_round.png';
import TypeNotch from '../../assets/images/style_icons/kurta/type_notch.png';
import TypeSquare from '../../assets/images/style_icons/kurta/type_square.png';
import EpNo from '../../assets/images/style_icons/kurta/ep_no.png';
import EpYes from '../../assets/images/style_icons/kurta/ep_yes.png';

// Collars
import CollarRound from '../../assets/images/style_icons/kurta/col_round_neck.png';
import CollarMandarin from '../../assets/images/style_icons/kurta/col_mandarin.png';
import CollarChinese from '../../assets/images/style_icons/kurta/col_chinese.png';
import CollarShirt from '../../assets/images/style_icons/kurta/col_shirt_round.png';
import CollarButtonDown from '../../assets/images/style_icons/kurta/col_button_down.png';
import CollarStandard from '../../assets/images/style_icons/kurta/col_standard.png';
import CollarSemiSpread from '../../assets/images/style_icons/kurta/col_semi_spread.png';
import CollarSpread from '../../assets/images/style_icons/kurta/col_spread.png';

// Sleeves & Cuffs
import SleeveNocuff from '../../assets/images/style_icons/kurta/sleeve_nocuff.png';
import SleeveCuff from '../../assets/images/style_icons/kurta/sleeve_cuff.png';

// Cuff Styles (Using same icons as pockets/flaps for now as per your data, or separate if you have them)
import CuffSquare1 from '../../assets/images/style_icons/kurta/type_square_c.png';
import CuffRound1 from '../../assets/images/style_icons/kurta/type_round_c.png';
import CuffNotch1 from '../../assets/images/style_icons/kurta/type_notch_c.png';
import CuffSquare2 from '../../assets/images/style_icons/kurta/type_square_c2.png';
import CuffRound2 from '../../assets/images/style_icons/kurta/type_round_c2.png';
import CuffNotch2 from '../../assets/images/style_icons/kurta/type_notch_c2.png';


// --- WRAPPER FUNCTION ---
const wrapIcon = (src, displayName) => {
  const IconComponent = ({ color = null, size = 60, style, ...rest }) => (
    <Image
      source={src}
      style={[{ width: size, height: size }, color ? { tintColor: color } : null, style]}
      resizeMode="contain"
      {...rest}
    />
  );
  IconComponent.displayName = displayName;
  return IconComponent;
};

// --- EXPORTS (Yahan se error aa raha tha kyunki ye missing the) ---
export const IconLenLong = wrapIcon(LenLong, 'IconLenLong');
export const IconLenShort = wrapIcon(LenShort, 'IconLenShort');
export const IconCutRound = wrapIcon(CutRound, 'IconCutRound');
export const IconCutStraight = wrapIcon(CutStraight, 'IconCutStraight');
export const IconPlacketNotch = wrapIcon(PlacketNotch, 'IconPlacketNotch');
export const IconPlacketSquare = wrapIcon(PlacketSquare, 'IconPlacketSquare');
export const IconPocket0 = wrapIcon(Pocket0, 'IconPocket0');
export const IconPocket1 = wrapIcon(Pocket1, 'IconPocket1');
export const IconPocket2 = wrapIcon(Pocket2, 'IconPocket2');
export const IconFlap0 = wrapIcon(Flap0, 'IconFlap0');
export const IconFlap1 = wrapIcon(Flap1, 'IconFlap1');
export const IconTypeRound = wrapIcon(TypeRound, 'IconTypeRound');
export const IconTypeNotch = wrapIcon(TypeNotch, 'IconTypeNotch');
export const IconTypeSquare = wrapIcon(TypeSquare, 'IconTypeSquare');
export const IconEpNo = wrapIcon(EpNo, 'IconEpNo');
export const IconEpYes = wrapIcon(EpYes, 'IconEpYes');

export const IconColRound = wrapIcon(CollarRound, 'IconColRound');
export const IconColMandarin = wrapIcon(CollarMandarin, 'IconColMandarin');
export const IconColChinese = wrapIcon(CollarChinese, 'IconColChinese');
export const IconColShirtRound = wrapIcon(CollarShirt, 'IconColShirtRound');
export const IconColButtonDown = wrapIcon(CollarButtonDown, 'IconColButtonDown');
export const IconColStandard = wrapIcon(CollarStandard, 'IconColStandard');
export const IconColSemiSpread = wrapIcon(CollarSemiSpread, 'IconColSemiSpread');
export const IconColSpread = wrapIcon(CollarSpread, 'IconColSpread');

export const IconSleeveNocuff = wrapIcon(SleeveNocuff, 'IconSleeveNocuff');
export const IconSleeveCuff = wrapIcon(SleeveCuff, 'IconSleeveCuff');

export const IconCuffSquare1 = wrapIcon(CuffSquare1 || TypeSquare, 'IconCuffSquare1');
export const IconCuffRound1 = wrapIcon(CuffRound1 || TypeRound, 'IconCuffRound1');
export const IconCuffNotch1 = wrapIcon(CuffNotch1 || TypeNotch, 'IconCuffNotch1');
export const IconCuffSquare2 = wrapIcon(CuffSquare2 || TypeSquare, 'IconCuffSquare2');
export const IconCuffRound2 = wrapIcon(CuffRound2 || TypeRound, 'IconCuffRound2');
export const IconCuffNotch2 = wrapIcon(CuffNotch2 || TypeNotch, 'IconCuffNotch2');