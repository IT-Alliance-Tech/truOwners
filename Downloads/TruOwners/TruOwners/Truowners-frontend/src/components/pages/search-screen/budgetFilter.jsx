// import Image from "next/image";
import React, { useEffect, useRef } from "react";
import BudgetIcon from "../../../assets/images/icons/Budget_icon";
import arrowDownIcon from "../../../assets/images/icons/arrowDownBlue.svg";
import arrowUpIcon from "../../../assets/images/icons/arrow-up-blue.svg";
import "./SearchScreen.css";
// import MultiRangeSlider from "../../components/search-screen/MultiRangeSlider";
import useScreenSize from "../../helper/userScreenSize";
import MultiRangeInput from "../Utils/MultiRangeInput";
export const BudgetFilter = ({
  isScrollable = false,
  selectedType = "sell",
  budgetData = {},
  showDropdown = false,
  handleShow = () => { },
  handleChange = () => { },
  defaultvalue = true,
  setShowPropTypeSelect = () => { },
  setShowBedroomSelect = () => { },
  setShowMoreFilter = () => { },
  setShowSearchFilter = () => { },
  setShowSelectFilter = () => { },
}) => {
  const width = useScreenSize();
  useEffect(() => {
    handleShow(false);
  }, [selectedType]);
  const mainRef = useRef(null);
  useEffect(() => {
    const checkIfClickedOutside = (e) => {
      if (mainRef.current && !mainRef.current.contains(e.target)) {
        handleShow(false);
      }
    };
    document.addEventListener("mousedown", checkIfClickedOutside);
    return () => {
      document.removeEventListener("mousedown", checkIfClickedOutside);
    };
  }, [showDropdown]);

  return (
    <div
      ref={mainRef}
      className={`${defaultvalue ? "input_design" : "home_input_design"
        }  ${isScrollable ? "position-static" : ""}`}
    >
      <div className="d-flex align-items-center p-2">
        <span>
          <BudgetIcon color={`${defaultvalue ? "#1D72DB" : "#50BF97"}`} />
        </span>
        <div
          className="d-flex justify-content-between cursor_pointer"
          onClick={() => {
            handleShow(!showDropdown);
            setShowPropTypeSelect(false);
            setShowBedroomSelect(false);
            setShowMoreFilter(false);
            setShowSearchFilter(false);
            setShowSelectFilter(false);
          }}
        >
          {(budgetData.min == 1 && budgetData.max == 400) ||
            (budgetData.min == 3000 && budgetData.max == 100000) ||
            (budgetData.min == 2000 && budgetData.max == 20000) ? (
            <span
              className={`bedroom_input_width ms-2 mt-1 fs_12 text_muted fw_500 `}
            >
              Budget
            </span>
          ) : (
            <span
              className={`bedroom_input_width ms-2 mt-1 fs_13 secondary_color fw_500 `}
            >
              {selectedType === "sell"
                ? (budgetData.min >= 100 && selectedType === "sell"
                  ? (budgetData.min / 100).toFixed(2) + "Cr -"
                  : budgetData.min === undefined
                    ? ""
                    : budgetData.min + "Lacs- ") +
                (budgetData.max >= 100 && selectedType === "sell"
                  ? (budgetData.max / 100).toFixed(2) +
                  `Cr${budgetData.max == 400 ? "+" : ""}`
                  : budgetData.max === undefined
                    ? ""
                    : budgetData.max + `Lacs`)
                : selectedType === "rent"
                  ? (budgetData.min >= 100000 && selectedType === "rent"
                    ? (budgetData.min / 100000).toFixed(2) + "Lacs -"
                    : budgetData.min + " - ") +
                  (budgetData.max >= 100000 && selectedType === "rent"
                    ? (budgetData.max / 100000).toFixed(2) +
                    `Lacs${budgetData.max == 100000 ? "+" : ""}`
                    : budgetData.max)
                  : selectedType === "pg"
                    ? (selectedType === "pg"
                      ? budgetData.min + " - "
                      : budgetData.min + " - ") +
                    (selectedType === "pg" ? budgetData.max : budgetData.max)
                    : ""}
            </span>
          )}
          <span>
            <img
              className=""
              src={showDropdown ? arrowUpIcon : arrowDownIcon}
              alt="arrowDownIcon"
              width={15}
            />
          </span>
        </div>
      </div>
      {showDropdown && (
        <div
          className={`${defaultvalue
            ? "budget_dropdown_content"
            : "home_budget_dropdown_content"
            }       ${isScrollable
              ? "dropdown_fullwidth"
              : defaultvalue
                ? "budget_dropdown_content"
                : "home_budget_dropdown_content"
            }                   position-absolute px-3 py-3`}
        >
          <div
            className={
              width <= 1480
                ? `d-flex justify-content-center`
                : `${isScrollable ? "d-flex justify-content-center" : ""}`
            }
          >
            <div>
              <span className="fs_13 fw_400 text_muted">
                Select your budget moving Arrows
              </span>
              <div className="pb-3">
                {/* <MultiRangeSlider
                  type={selectedType}
                  selectedMin={budgetData.min}
                  selectedMax={budgetData.max}
                  min={selectedType === "sell" ? 0 : 3}
                  max={selectedType === "sell" ? 100 : 300}
                  onChange={({ min, max }) => handleChange({ min, max })}
                /> */}
                <div className="pb-4 mt-4">
                  <MultiRangeInput
                    step={selectedType === "sell" ? 1 : 500}
                    type={selectedType}
                    selectedMin={budgetData.min}
                    selectedMax={budgetData.max}
                    min={selectedType === "sell" ? 1 : 3000}
                    max={selectedType === "sell" ? 400 : 100000}
                    onChange={({ min, max }) => {
                      handleChange({ min, max });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
