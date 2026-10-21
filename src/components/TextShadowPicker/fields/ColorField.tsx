import { useEffect, useState } from 'react';

import { styled } from 'styled-components';

import { parseHexColor, parseRgbColor } from '../common';
import { Label } from '../inputs/Label';
import { TextShadowInput } from '../inputs/TextShadowInput';

const Wrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
`;

const Slider = styled.input`
  flex: 1;

  appearance: none;
  width: 100%;
  height: 2px;
  background: #555a;
  outline: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #4285f4;
    cursor: pointer;
  }
`;

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const useHex = (value: string) => {
  const [alpha, setAlpha] = useState(0);
  const [color, setColor] = useState('');

  useEffect(() => {
    const hex = parseHexColor(value) || parseRgbColor(value);
    if (hex) {
      setAlpha(hex.alpha);
      setColor(hex.color);
    }
  }, [value]);

  return { color, alpha };
};

export const ColorField = ({ value, onChange }: Props) => {
  const { color, alpha } = useHex(value);

  const updated: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(e.target.value + alpha.toString(16).padStart(2, '0'));
  };

  const updatedInput: (value: string) => void = (e) => {
    onChange(e);
  };

  const updatedAlpha: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const aInt = Math.max(0, Math.min(255, parseInt(e.target.value)));
    const hex = aInt.toString(16).padStart(2, '0');
    onChange(color + hex);
  };

  return (
    <Wrapper>
      <Label>Colour</Label>
      <TextShadowInput value={value} onChange={updatedInput} />
      <input value={color} onChange={updated} type={'color'} />
      <Slider className={'text-shadow-picker__slider'} type={'range'} value={alpha} onChange={updatedAlpha} max={255} />
    </Wrapper>
  );
};
