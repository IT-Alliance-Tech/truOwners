import React, { useEffect, useState } from "react";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";
import "./components.css";
const MultiRangeInput = ({
  type = "sell",
  onChange,
  selectedMin,
  selectedMax,
  subPropertyType,
  key,
  step = 1,
}) => {
  const [inputRangeValue, setInputRangeValue] = useState([
    selectedMin,
    selectedMax,
  ]);
  const [min, setMin] = useState(
    type === "sell"
      ? 1
      : type === "rent"
      ? 3000
      : type === "Acre"
      ? 0
      : type === "pg"
      ? 2000
      : 100
  );
  const [max, setMax] = useState(
    type === "sell"
      ? 400
      : type === "rent"
      ? 100000
      : type === "Acre"
      ? 100
      : type === "pg"
      ? 20000
      : 20000
  );
  useEffect(() => {
    onChange({ min: inputRangeValue?.[0], max: inputRangeValue?.[1] });
    setMin(
      type === "sell"
        ? 1
        : type === "rent"
        ? 3000
        : type === "Acre"
        ? 0
        : type === "pg"
        ? 2000
        : 100
    );
    setMax(
      type === "sell"
        ? 400
        : type === "rent"
        ? 100000
        : type === "Acre"
        ? 100
        : 20000
    );
  }, [inputRangeValue, type]);
  return (
    <div className="d-flex position-relative align-items-center d-flex justify-content-center">
      <RangeSlider
        {...(key && { key: key })}
        min={min}
        max={max}
        step={step}
        value={inputRangeValue}
        onInput={setInputRangeValue}
        id="range-slider-ab"
      />
      <div
        className={`position-absolute start-0 mt-5 secondary-color inputRangeValue`}
      >
        {type === "sell" || type === "rent" ? "₹ " : type === "pg" ? "₹ " : ""}
        {type === "rent" && inputRangeValue?.[0] >= 100000
          ? (inputRangeValue?.[0] / 100000).toFixed(2)
          : type === "sell" && inputRangeValue?.[0] >= 100
          ? (inputRangeValue?.[0] / 100).toFixed(2)
          : inputRangeValue?.[0]}
        {type === "sell" && inputRangeValue?.[0] >= 100
          ? " Cr"
          : type === "sell" && inputRangeValue?.[0] < 100
          ? "Lacs"
          : type === "rent" && inputRangeValue?.[0] >= 100000
          ? " Lacs"
          : type === "rent"
          ? ""
          : type === "pg"
          ? ""
          : type === "Acre"
          ? "Acre"
          : "sqft"}
      </div>
      <div
        className={`position-absolute end-0 mt-5 secondary-color inputRangeValue`}
      >
        {type === "sell" || type === "rent" ? "₹ " : type === "pg" ? "₹ " : ""}
        {type === "rent" && inputRangeValue?.[1] >= 100000
          ? (inputRangeValue?.[1] / 100000).toFixed(2)
          : type === "sell" && inputRangeValue?.[1] >= 100
          ? (inputRangeValue?.[1] / 100).toFixed(2)
          : inputRangeValue?.[1]}
        {type === "sell" && inputRangeValue?.[1] >= 100
          ? ` Cr${inputRangeValue[1] == 400 ? "+" : ""}`
          : type === "sell" && inputRangeValue?.[0] < 100
          ? "Lacs"
          : type === "rent" && inputRangeValue?.[1] >= 100000
          ? ` Lacs${inputRangeValue[1] == 100000 ? "+" : ""}`
          : type === "rent"
          ? ""
          : type === "pg"
          ? ""
          : type === "Acre"
          ? "Acre"
          : "sqft"}
      </div>
    </div>
  );
};
export default MultiRangeInput;
