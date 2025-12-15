// import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
// import homeIcon from "../../assets/icons/home.svg";
import "../search-screen/SearchScreen.css";
import { removeUnderScore } from "../../helper/helper";
import CancelIcon from "../../../assets/images/icons/Budget_icon";
import arrowDownIcon from "../../../assets/images/icons/arrowDownBlue.svg";
import arrowUpIcon from "../../../assets/images/icons/arrow-up-blue.svg";
import PlusIcon from "../../../assets/images/icons/Plus_icon.svg";
import RightMarkIcon from "../../../assets/images/icons/Right_icon.svg";
import HomeIcon from "../../../assets/images/icons/homeIcon";

const PropertyTypeSelect = ({
  // mainPropType = "residential",
  isScrollable = false,
  showDropdown = false,
  propertyTypeData = [],
  handleShow = () => { },
  handleClickCancel = () => { },
  handleClickSelect = () => { },
  defaultvalue = true,
  setShowBudgetSelect = () => { },
  setShowBedroomSelect = () => { },
  setShowPostedBySelect = () => { },
  setShowMoreFilter = () => { },
  setShowPlotSelect = () => { },
  searchFilterClose = () => { },
  setShowSearchFilter = () => { },
  setShowSelectFilter = () => { },
  webDropdown = {},
  mobileDropdown = {},
}) => {
  const mainRef = useRef(null);
  useEffect(() => {
    const checkIfClickedOutside = (e) => {
      if (mainRef.current && !mainRef.current.contains(e.target)) {
        // handleShow(false);
      }
    };
    document.addEventListener("mousedown", checkIfClickedOutside);
    return () => {
      document.removeEventListener("mousedown", checkIfClickedOutside);
    };
  }, [showDropdown]);

  const mainPropType = residentialProperties.find(
    (item) => item.value === propertyTypeData[0]
  )
    ? "residential"
    : commercialProperties.find((item) => item.value === propertyTypeData[0])
      ? "commercial"
      : "agriculture";
  return (
    <div
      ref={mainRef}
      className={`${defaultvalue ? "input_design" : "home_input_design"
        } ${isScrollable ? "position-static" : ""} property_selection `}
    >
      <div className="d-flex align-items-center p-2">
        {/* <Image src={homeIcon} alt="homeIcon" /> */}
        <HomeIcon color={`${defaultvalue ? "#1D72DB" : "#50BF97"}`} />
        <div
          className="d-flex justify-content-between"
          onClick={() => {
            handleShow(!showDropdown);
            setShowBudgetSelect(false);
            setShowBedroomSelect(false);
            setShowPostedBySelect(false);
            setShowMoreFilter(false);
            setShowPlotSelect(false);
            setShowSearchFilter(false);
            setShowSelectFilter(false);
            searchFilterClose();
          }}
        >
          <span
            className={`property_type_input_width mt-1 fs_12 text_muted fw_500 cursor_pointer`}
          >
            {propertyTypeData.length === 0 ? (
              <span className="fs_12 fw_500 text_muted ms-2">
                Property types
              </span>

            ) : propertyTypeData.length <= 1 ? (
              <div className="d-flex ">
                <div
                  className={`postedby_input_data d-flex align-items-center px-1 ms-2`}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "110px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      paddingTop: "2px",
                      paddingBottom: "2px",
                    }}
                    className="text-nowrap text-center "
                  >
                    {residentialProperties.find(
                      (item) => item.value === propertyTypeData[0]
                    )?.propertyName ??
                      commercialProperties.find(
                        (item) => item.value === propertyTypeData[0]
                      )?.propertyName ??
                      agricultureProperties.find(
                        (item) => item.value === propertyTypeData[0]
                      )?.propertyName ??
                      removeUnderScore(propertyTypeData[0]) ??
                      null}
                  </span>
                  <img
                    onClick={() => {
                      handleClickCancel("first");
                    }}
                    src={CancelIcon}
                    className={"ms-2"}
                    alt="cancel"
                  />
                </div>
              </div>
            ) : (
              <div className="d-flex">
                <div
                  className={`postedby_input_data d-flex align-items-center px-1`}
                >
                  <span
                    className="text-nowrap text-center"
                    style={{
                      display: "inline-block",
                      width: "80px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      paddingTop: "2px",
                      paddingBottom: "2px",
                    }}
                  >
                    {residentialProperties.find(
                      (item) => item.value === propertyTypeData[0]
                    )?.propertyName ??
                      commercialProperties.find(
                        (item) => item.value === propertyTypeData[0]
                      )?.propertyName ??
                      agricultureProperties.find(
                        (item) => item.value === propertyTypeData[0]
                      )?.propertyName ??
                      removeUnderScore(propertyTypeData[0]) ??
                      null}
                  </span>
                  <img
                    onClick={() => {
                      handleClickCancel("first");
                    }}
                    className="ms-2"
                    src={CancelIcon}
                    alt="cancel_icon"
                  />
                </div>

                <div
                  title={
                    mainPropType === "residential"
                      ? residentialProperties
                        .filter((item) =>
                          propertyTypeData.slice(1).includes(item.value)
                        )
                        .map((item) => item.propertyName)
                      : mainPropType === "commercial"
                        ? commercialProperties
                          .filter((item) =>
                            propertyTypeData.slice(1).includes(item.value)
                          )
                          .map((item) => item.propertyName)
                        : agricultureProperties
                          .filter((item) =>
                            propertyTypeData.slice(1).includes(item.value)
                          )
                          .map((item) => item.propertyName)
                  }
                  className={`postedby_input_data ms-2 px-1 d-flex align-items-center`}
                >
                  <div>+{propertyTypeData.length - 1}</div>
                  <img
                    onClick={() => handleClickCancel()}
                    className="mx-1 cursor_pointer"
                    src={CancelIcon}
                    width={9}
                    alt="cancel_icon"
                  />
                </div>
              </div>
            )}
          </span>
          <span className="cursor_pointer">
            <img src={showDropdown ? arrowUpIcon : arrowDownIcon} alt="arrowDownIcon" width={15} />
          </span>
        </div>
      </div>

      {webDropdown === true && showDropdown && (
        <div
          className={`${isScrollable ? "dropdown_fullwidth" : defaultvalue
            ? "property_type_dropdown_content"
            : "home_property_type_dropdown_content"
            } position-absolute`}
        >
          <div className="card border-0">
            <div className="card-body">
              <div className="py-3 position-relative">
                <div className="fs_14 fw_500 secondary_color ms-1">
                  Residential
                </div>
                <div className="row gap-2 mt-2 ms-1">
                  {residentialProperties.map((residentialItem, index) => {
                    return (
                      <>
                        <button
                          key={index}
                          className={
                            propertyTypeData.includes(residentialItem.value)
                              ? `clickOn_button_after`
                              : `styles.button_design fs_12 fw_500 `
                          }
                          onClick={(e) => {
                            handleClickSelect(residentialItem.value);
                          }}
                        // disabled={propertyTypeData.some((item) =>
                        //   commercialValueList.includes(item)
                        // )}
                        >
                          <span className="d-flex align-items-center p-1">
                            <img
                              src={
                                propertyTypeData.includes(residentialItem.value)
                                  ? RightMarkIcon
                                  : PlusIcon
                              }
                              alt="Status_Icon"
                            />
                            <span
                              className={
                                propertyTypeData.includes(residentialItem.value)
                                  ? `text-white ms-2 fs_12 fw_500`
                                  : ` ms-2 fs_12 fw_500`
                              }
                            >
                              {residentialItem.propertyName}
                            </span>
                          </span>
                        </button>
                      </>
                    );
                  })}
                </div>
                <div className="fs_14 fw_500 secondary_color ms-1 mt-3">
                  Commercial
                </div>
                <div className="row gap-2 mt-2 ms-1">
                  {commercialProperties.map((residentialItem, index) => {
                    return (
                      <>
                        <button
                          key={index}
                          className={
                            propertyTypeData.includes(residentialItem.value)
                              ? `clickOn_button_after `
                              : `button_design fs_12 fw_500 `
                          }
                          onClick={(e) => {
                            handleClickSelect(residentialItem.value);
                          }}
                        // disabled={propertyTypeData.some((item) =>
                        //   residentialValueList.includes(item)
                        // )}
                        >
                          <span className="d-flex align-items-center p-1">
                            <img
                              src={
                                propertyTypeData.includes(residentialItem.value)
                                  ? RightMarkIcon
                                  : PlusIcon
                              }
                              alt="Status_Icon"
                            />
                            <span
                              className={
                                propertyTypeData.includes(residentialItem.value)
                                  ? `text-white ms-2 fs_12 fw_500`
                                  : ` ms-2 fs_12 fw_500`
                              }
                            >
                              {residentialItem.propertyName}
                            </span>
                          </span>
                        </button>
                      </>
                    );
                  })}
                </div>
                <div className="fs_14 fw_500 secondary_color ms-1 mt-3">
                  Agriculture
                </div>
                <div className="row gap-2 mt-2 ms-1">
                  {agricultureProperties.map((agricultureItem, index) => {
                    return (
                      <>
                        <button
                          key={index}
                          className={
                            propertyTypeData.includes(agricultureItem.value)
                              ? `clickOn_button_after `
                              : `button_design fs_12 fw_500 `
                          }
                          onClick={(e) => {
                            handleClickSelect(agricultureItem.value);
                          }}
                        // disabled={propertyTypeData.some((item) =>
                        //   commercialValueList.includes(item)
                        // )}
                        >
                          <span className="d-flex align-items-center p-1">
                            <img
                              src={
                                propertyTypeData.includes(agricultureItem.value)
                                  ? RightMarkIcon
                                  : PlusIcon
                              }
                              alt="Status_Icon"
                            />
                            <span
                              className={
                                propertyTypeData.includes(agricultureItem.value)
                                  ? `text-white ms-2 fs_12 fw_500`
                                  : ` ms-2 fs_12 fw_500`
                              }
                            >
                              {agricultureItem.propertyName}
                            </span>
                          </span>
                        </button>
                      </>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {mobileDropdown === true && showDropdown && "hsdgge"}
    </div>
  );
};

export default PropertyTypeSelect;

export const agricultureProperties = [
  {
    propertyName: "Farm House",
    value: "farm_house",
  },
  {
    propertyName: "Agriculture Land",
    value: "land",
  },
];

export const commercialProperties = [
  {
    propertyName: "Office Space",
    value: "office_space",
  },
  {
    propertyName: "Commercial Shop",
    value: "commercial_shop",
  },
  {
    propertyName: "Commercial Showroom",
    value: "commercial_showroom",
  },
  {
    propertyName: "Warehouse/Godown",
    value: "warehouse",
  },
  {
    propertyName: "Industrial Building",
    value: "industrial_building",
  },
  {
    propertyName: "Industrial Shed",
    value: "industrial_shed",
  },
  {
    propertyName: "Commercial Land",
    value: "commercial_plot",
  },
  {
    propertyName: "Industrial Land",
    value: "industrial_plot",
  },
];

export const residentialProperties = [
  {
    propertyName: "Flat/Apartment",
    value: "apartment",
  },
  {
    propertyName: "Residential House",
    value: "residential",
  },
  {
    propertyName: "Plot/Land",
    value: "plot",
  },
  {
    propertyName: "Villa/Bungalow",
    value: "villa",
  },
];