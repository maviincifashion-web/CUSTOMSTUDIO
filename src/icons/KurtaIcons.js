// src/icons/KurtaIcons.js
import React from 'react';
import { Image } from 'react-native';

// Kurta SVG icon imports
import LenLong from '../../assets/images/style_icons/svg_style_icon/kurta svg/len_long.svg';
import LenShort from '../../assets/images/style_icons/svg_style_icon/kurta svg/len_short.svg';
import CutRound from '../../assets/images/style_icons/svg_style_icon/kurta svg/cut_round.svg';
import CutStraight from '../../assets/images/style_icons/svg_style_icon/kurta svg/cut_straight.svg';
import PlacketNotch from '../../assets/images/style_icons/svg_style_icon/kurta svg/placket_notch.svg';
import PlacketSquare from '../../assets/images/style_icons/svg_style_icon/kurta svg/placket_square.svg';
import Pocket0 from '../../assets/images/style_icons/svg_style_icon/kurta svg/pocket_0.svg';
import Pocket1 from '../../assets/images/style_icons/svg_style_icon/kurta svg/pocket_1.svg';
import Pocket2 from '../../assets/images/style_icons/svg_style_icon/kurta svg/pocket_2.svg';
import Flap0 from '../../assets/images/style_icons/svg_style_icon/kurta svg/flap_0.svg';
import Flap1 from '../../assets/images/style_icons/svg_style_icon/kurta svg/flap_1.svg';
import TypeRound from '../../assets/images/style_icons/svg_style_icon/kurta svg/type_round.svg';
import TypeNotch from '../../assets/images/style_icons/svg_style_icon/kurta svg/type_notch.svg';
import TypeSquare from '../../assets/images/style_icons/svg_style_icon/kurta svg/type_square.svg';
import EpNo from '../../assets/images/style_icons/svg_style_icon/kurta svg/ep_no.svg';
import EpYes from '../../assets/images/style_icons/svg_style_icon/kurta svg/ep_yes.svg';

// Collars
import CollarRound from '../../assets/images/style_icons/svg_style_icon/kurta svg/col_round_neck.svg';
import CollarMandarin from '../../assets/images/style_icons/svg_style_icon/kurta svg/col_mandarin.svg';
import CollarChinese from '../../assets/images/style_icons/svg_style_icon/kurta svg/col_chinese.svg';
import CollarShirt from '../../assets/images/style_icons/svg_style_icon/kurta svg/col_shirt_round.svg';
import CollarButtonDown from '../../assets/images/style_icons/svg_style_icon/kurta svg/col_button_down.svg';
import CollarStandard from '../../assets/images/style_icons/svg_style_icon/kurta svg/col_standard.svg';
import CollarSemiSpread from '../../assets/images/style_icons/svg_style_icon/kurta svg/col_semi_spread.svg';
import CollarSpread from '../../assets/images/style_icons/svg_style_icon/kurta svg/col_spread.svg';

// Sleeves & Cuffs
import SleeveNocuff from '../../assets/images/style_icons/svg_style_icon/kurta svg/sleeve_nocuff.svg';
import SleeveCuff from '../../assets/images/style_icons/svg_style_icon/kurta svg/sleeve_cuff.svg';

// Cuff Styles (Using same icons as pockets/flaps for now as per your data, or separate if you have them)
import CuffSquare1 from '../../assets/images/style_icons/svg_style_icon/kurta svg/type_square_c.svg';
import CuffRound1 from '../../assets/images/style_icons/svg_style_icon/kurta svg/type_round_c.svg';
import CuffNotch1 from '../../assets/images/style_icons/svg_style_icon/kurta svg/type_notch_c.svg';
import CuffSquare2 from '../../assets/images/style_icons/svg_style_icon/kurta svg/type_square_c2.svg';
import CuffRound2 from '../../assets/images/style_icons/svg_style_icon/kurta svg/type_round_c2.svg';
import CuffNotch2 from '../../assets/images/style_icons/svg_style_icon/kurta svg/type_notch_c2.svg';
import SadriEssentialNehru from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Essential Nehru-01.svg';
import SadriSignatureCurve from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Signature Curve-01.svg';
import SadriCommand from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Command-01.svg';
import SadriRanger from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Ranger-01.svg';
import SadriEliteMinimal from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Elite Minimal-01.svg';
import SadriMetroUtility from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Metro Utility-01.svg';
import SadriAvantEdge from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Avant Edge-01.svg';
import SadriOfficer from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Officer-01.svg';
import SadriRoyalWrap from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Royal Wrap-01.svg';
import SadriModernRoyal from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Modern Royal-01.svg';
import SadriRoyalAsym from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Royal Asym-01.svg';
import SadriImperialSeamless from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Imperial Seamless-01.svg';
import PajamaSalwar from '../../assets/images/style_icons/svg_style_icon/Pajama svg/SALWAR-01.svg';
import PajamaDhoti from '../../assets/images/style_icons/svg_style_icon/Pajama svg/DHOTI-01.svg';
import PajamaPajama from '../../assets/images/style_icons/svg_style_icon/Pajama svg/PAJAMA-01.svg';
import PajamaChudidar from '../../assets/images/style_icons/svg_style_icon/Pajama svg/CHURIDAR-01-01.svg';
import PajamaPatiala from '../../assets/images/style_icons/svg_style_icon/Pajama svg/PATIALA-01.svg';
import PajamaAligarhi from '../../assets/images/style_icons/svg_style_icon/Pajama svg/ALIGARHI-01.svg';
import PajamaPant from '../../assets/images/style_icons/svg_style_icon/Pajama svg/PANT-01.svg';
import PajamaBellbottom from '../../assets/images/style_icons/svg_style_icon/Pajama svg/BELLBOTTOM-01.svg';
import PajamaRope from '../../assets/images/style_icons/svg_style_icon/Pajama svg/rope-01.svg';
import PajamaElastic from '../../assets/images/style_icons/svg_style_icon/Pajama svg/elastic-01.svg';
import SadriClassicLapel from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Classic Lapel-01.svg';
import SadriHeritage from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Heritage-01.svg';
import SadriUrbanSafari from '../../assets/images/style_icons/svg_style_icon/Sadri svg/Urban Safari-01.svg';


// --- WRAPPER FUNCTION ---
const wrapIcon = (src, displayName) => {
  const IconComponent = ({ color = null, size = 60, style, ...rest }) => {
    const resolved = src?.default || src;

    if (
      typeof resolved === 'number' ||
      typeof resolved === 'string' ||
      (resolved && typeof resolved === 'object' && !('render' in resolved) && !('prototype' in resolved))
    ) {
      return (
        <Image
          source={resolved}
          style={[{ width: size, height: size }, color ? { tintColor: color } : null, style]}
          resizeMode="contain"
          {...rest}
        />
      );
    }

    const SvgComponent = resolved;
    return (
      <SvgComponent
        width={size}
        height={size}
        style={style}
        {...rest}
      />
    );
  };
  IconComponent.displayName = displayName;
  return IconComponent;
};

const wrapSvgIcon = (SvgComponent, displayName) => {
  const IconComponent = ({ size = 60, style, ...rest }) => (
    <SvgComponent
      width={size}
      height={size}
      style={style}
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
export const IconSadriEssentialNehru = wrapSvgIcon(SadriEssentialNehru, 'IconSadriEssentialNehru');
export const IconSadriSignatureCurve = wrapSvgIcon(SadriSignatureCurve, 'IconSadriSignatureCurve');
export const IconSadriCommand = wrapSvgIcon(SadriCommand, 'IconSadriCommand');
export const IconSadriRanger = wrapSvgIcon(SadriRanger, 'IconSadriRanger');
export const IconSadriEliteMinimal = wrapSvgIcon(SadriEliteMinimal, 'IconSadriEliteMinimal');
export const IconSadriMetroUtility = wrapSvgIcon(SadriMetroUtility, 'IconSadriMetroUtility');
export const IconSadriAvantEdge = wrapSvgIcon(SadriAvantEdge, 'IconSadriAvantEdge');
export const IconSadriOfficer = wrapSvgIcon(SadriOfficer, 'IconSadriOfficer');
export const IconSadriRoyalWrap = wrapSvgIcon(SadriRoyalWrap, 'IconSadriRoyalWrap');
export const IconSadriModernRoyal = wrapSvgIcon(SadriModernRoyal, 'IconSadriModernRoyal');
export const IconSadriRoyalAsym = wrapSvgIcon(SadriRoyalAsym, 'IconSadriRoyalAsym');
export const IconSadriImperialSeamless = wrapSvgIcon(SadriImperialSeamless, 'IconSadriImperialSeamless');
export const IconSadriClassicLapel = wrapSvgIcon(SadriClassicLapel, 'IconSadriClassicLapel');
export const IconSadriHeritage = wrapSvgIcon(SadriHeritage, 'IconSadriHeritage');
export const IconSadriUrbanSafari = wrapSvgIcon(SadriUrbanSafari, 'IconSadriUrbanSafari');
export const IconPajamaSalwar = wrapSvgIcon(PajamaSalwar, 'IconPajamaSalwar');
export const IconPajamaDhoti = wrapSvgIcon(PajamaDhoti, 'IconPajamaDhoti');
export const IconPajamaPajama = wrapSvgIcon(PajamaPajama, 'IconPajamaPajama');
export const IconPajamaChudidar = wrapSvgIcon(PajamaChudidar, 'IconPajamaChudidar');
export const IconPajamaPatiala = wrapSvgIcon(PajamaPatiala, 'IconPajamaPatiala');
export const IconPajamaAligarhi = wrapSvgIcon(PajamaAligarhi, 'IconPajamaAligarhi');
export const IconPajamaPant = wrapSvgIcon(PajamaPant, 'IconPajamaPant');
export const IconPajamaBellbottom = wrapSvgIcon(PajamaBellbottom, 'IconPajamaBellbottom');
export const IconPajamaRope = wrapSvgIcon(PajamaRope, 'IconPajamaRope');
export const IconPajamaElastic = wrapSvgIcon(PajamaElastic, 'IconPajamaElastic');