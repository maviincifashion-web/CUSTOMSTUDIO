import React from 'react';
import { Image } from 'react-native';


import Fabric from '../../assets/images/extra_icons/Fabric.png';
import Style from '../../assets/images/extra_icons/stitching.png';
import Embroidery from '../../assets/images/extra_icons/embroidery.png';
import Extras from '../../assets/images/extra_icons/add.png';

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

export const IconFabric = wrapIcon(Fabric, 'Fabric');
export const IconStyle = wrapIcon(Style, 'Style');
export const IconEmbroidery = wrapIcon(Embroidery, 'Embroidery');
export const IconExtras = wrapIcon(Extras, 'Extras');