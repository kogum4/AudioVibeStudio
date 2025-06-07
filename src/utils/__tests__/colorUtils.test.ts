import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  adjustBrightness,
  blendColors,
  getComplementaryColor,
  generateColorPalette,
  isColorDark,
  getContrastColor,
  validateColor,
  formatColorAsRgba
} from '../colorUtils';

describe('colorUtils', () => {
  describe('hexToRgb', () => {
    it('should convert hex to RGB correctly', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should return null for invalid hex codes', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#gg0000')).toBeNull();
      expect(hexToRgb('')).toBeNull();
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex correctly', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    });

    it('should handle fractional values by rounding', () => {
      expect(rgbToHex(255.7, 0.3, 0.1)).toBe('#ff0000');
      expect(rgbToHex(127.4, 127.6, 127.9)).toBe('#7f8080');
    });
  });

  describe('rgbToHsl and hslToRgb', () => {
    it('should convert RGB to HSL and back correctly', () => {
      const rgb = { r: 255, g: 0, b: 0 };
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const backToRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      
      expect(Math.round(backToRgb.r)).toBe(rgb.r);
      expect(Math.round(backToRgb.g)).toBe(rgb.g);
      expect(Math.round(backToRgb.b)).toBe(rgb.b);
    });

    it('should handle grayscale colors', () => {
      const hsl = rgbToHsl(128, 128, 128);
      expect(hsl.s).toBeCloseTo(0, 1);
      expect(hsl.l).toBeCloseTo(50.2, 1);
    });
  });

  describe('adjustBrightness', () => {
    it('should brighten colors', () => {
      const result = adjustBrightness('#808080', 50);
      const rgb = hexToRgb(result);
      expect(rgb!.r).toBe(178);
      expect(rgb!.g).toBe(178);
      expect(rgb!.b).toBe(178);
    });

    it('should darken colors', () => {
      const result = adjustBrightness('#808080', -50);
      const rgb = hexToRgb(result);
      expect(rgb!.r).toBe(78);
      expect(rgb!.g).toBe(78);
      expect(rgb!.b).toBe(78);
    });

    it('should clamp values to valid range', () => {
      const brighten = adjustBrightness('#ffffff', 100);
      expect(brighten).toBe('#ffffff');
      
      const darken = adjustBrightness('#000000', -100);
      expect(darken).toBe('#000000');
    });
  });

  describe('blendColors', () => {
    it('should blend two colors correctly', () => {
      const result = blendColors('#ff0000', '#0000ff', 0.5);
      const rgb = hexToRgb(result);
      expect(rgb!.r).toBe(128);
      expect(rgb!.g).toBe(0);
      expect(rgb!.b).toBe(128);
    });

    it('should return first color when ratio is 0', () => {
      const result = blendColors('#ff0000', '#0000ff', 0);
      expect(result).toBe('#ff0000');
    });

    it('should return second color when ratio is 1', () => {
      const result = blendColors('#ff0000', '#0000ff', 1);
      expect(result).toBe('#0000ff');
    });
  });

  describe('getComplementaryColor', () => {
    it('should return complementary color', () => {
      const red = '#ff0000';
      const complementary = getComplementaryColor(red);
      const complementaryRgb = hexToRgb(complementary)!;
      const originalRgb = hexToRgb(red)!;
      const hsl = rgbToHsl(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b);
      const originalHsl = rgbToHsl(originalRgb.r, originalRgb.g, originalRgb.b);
      
      expect(Math.abs(hsl.h - originalHsl.h)).toBeCloseTo(180, 0);
    });
  });

  describe('generateColorPalette', () => {
    it('should generate a color palette', () => {
      const palette = generateColorPalette('#ff0000', 5);
      expect(palette).toHaveLength(5);
      expect(palette[0]).toBe('#ff0000');
      
      // All colors should be valid hex codes
      palette.forEach(color => {
        expect(validateColor(color)).toBe(true);
      });
    });
  });

  describe('isColorDark', () => {
    it('should identify dark colors', () => {
      expect(isColorDark('#000000')).toBe(true);
      expect(isColorDark('#333333')).toBe(true);
      expect(isColorDark('#ff0000')).toBe(true); // Red is considered dark
    });

    it('should identify light colors', () => {
      expect(isColorDark('#ffffff')).toBe(false);
      expect(isColorDark('#cccccc')).toBe(false);
      expect(isColorDark('#ffff00')).toBe(false); // Yellow is light
    });
  });

  describe('getContrastColor', () => {
    it('should return white for dark backgrounds', () => {
      expect(getContrastColor('#000000')).toBe('#ffffff');
      expect(getContrastColor('#333333')).toBe('#ffffff');
    });

    it('should return black for light backgrounds', () => {
      expect(getContrastColor('#ffffff')).toBe('#000000');
      expect(getContrastColor('#cccccc')).toBe('#000000');
    });
  });

  describe('validateColor', () => {
    it('should validate correct hex colors', () => {
      expect(validateColor('#ff0000')).toBe(true);
      expect(validateColor('#000000')).toBe(true);
      expect(validateColor('#ffffff')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(validateColor('invalid')).toBe(false);
      expect(validateColor('#gg0000')).toBe(false);
      expect(validateColor('')).toBe(false);
    });
  });

  describe('formatColorAsRgba', () => {
    it('should format color as RGBA', () => {
      expect(formatColorAsRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
      expect(formatColorAsRgba('#00ff00')).toBe('rgba(0, 255, 0, 1)');
    });

    it('should handle invalid colors with fallback', () => {
      expect(formatColorAsRgba('invalid', 0.8)).toBe('rgba(255, 255, 255, 0.8)');
    });
  });
});