import React, { useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
import PathIcon from "../../../assets/images/home/Path_icon(search).svg";
import CloseIcon from "../../../assets/images/home/close-icon.svg";
import "../search-screen/SearchScreen.css";
// import {
//   locationUpdateAction,
//   searchAutocompleteAction,
// } from "@/redux/actions/searchAction";
import useScreenSize from "../../helper/userScreenSize";
// import Image from "next/image";
import { useLayoutEffect } from "react";
// import { throttle } from "../../components/helper/asyncSelectComp";
import InfiniteScroll from "react-infinite-scroll-component";

const SearchBar = ({
  isScrollable = false,
  containerClass = "input_design",
  inputClass = "search_city_input",
  dropDownClass = "search_localities_dropdown_content",
  locationIcon = PathIcon,
  containerStyle = {},
  dropDownStyle = {},
  inputStyle = {},
  showSearchFilter,
  setShowSearchFilter = () => { },
  getSelectedSearchCity = () => { }
}) => {
  // const dispatch = useDispatch();
  const listRef = useRef(null);
  const mainRef = useRef(null);
  const inputRef = useRef(null);
  const width = useScreenSize();
  const [pageNo, setPageNo] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [dataLength, setDataLength] = useState(0);
  // const locationData = useSelector((state) => state.locationDataReducer);
  const selectedOptions = "Bangalore";
  // const selectedOptions = useSelector(
  //   (state) => state.locationDataReducer?.selectedOptions
  // );
  const [searchInputValue, setSearchInputValue] = useState("");
  const [autoSearchValue, setAutoSearchValue] = useState([]);
  // const [showSearchFilter, setShowSearchFilter] = useState(false);
  const handleInputChange = (value) => {
    setSearchInputValue(value);
  };
  const debouncedHandleInputChange = useRef(
    debounce((value) => handleInputChange(value), 75)
  ).current;
  const handleInput = (e) => {
    const value = e.target.value;
    debouncedHandleInputChange(value);
  };
  useEffect(() => {
    const checkIfClickedOutside = (e) => {
      if (mainRef.current && !mainRef.current.contains(e.target)) {
        if (!selectedOptions[0]?.value?.city ) {
          // alert("aaaaaaaaaaa")
          let cityName = localStorage.getItem(
            "prev_city_name",
          );
          // dispatch(
          //   locationUpdateAction(
          //     "",
          //     {
          //       city: cityName,
          //       // locality: null,
          //     },
          //     [
          //       {
          //         label: cityName,
          //         value: {
          //           city: cityName,
          //           locality: null,
          //           // id: null,
          //         },
          //       },
          //     ]
          //   )
          // );
        }
        setShowSearchFilter(false);
      }
    };
    document.addEventListener("mousedown", checkIfClickedOutside);
    return () => {
      document.removeEventListener("mousedown", checkIfClickedOutside);
    };
  }, [searchInputValue,selectedOptions[0]?.value?.city]);

  useEffect(() => {
    getSelectedSearchCity(selectedOptions);
    setPageNo(0);
    // dispatch(
    //   searchAutocompleteAction(
    //     0,
    //     {
    //       city_name: selectedOptions[0]?.value?.city ?? "",
    //       search_string: searchInputValue,
    //     },
    //     onSuccessAutoSearch,
    //     onErrorAutoSearch
    //   )
    // );
  }, [searchInputValue, selectedOptions[0]?.value?.city, selectedOptions.length]);
  useEffect(() => {
    // pageNo !== 0 &&
      // dispatch(
      //   searchAutocompleteAction(
      //     pageNo,
      //     {
      //       city_name: selectedOptions[0]?.value?.city ?? "",
      //       search_string: searchInputValue,
      //       city_name: selectedOptions[0]?.value?.city ?? "",
      //       search_string: searchInputValue,
      //     },
      //     onSuccessAutoSearch,
      //     onErrorAutoSearch
      //   )
      // );
  }, [pageNo]);
  const handleClickSelectedCity = (type, item) => {
    let data = [];
    if (type === "add") {
      data = [...selectedOptions, item];
    } else {
      data = selectedOptions?.filter((content) => content.label !== item.label);
      if (data.length === 0) {
        setShowSearchFilter(true)
      }
    }
    // dispatch(locationUpdateAction("", {}, data));
  };

  function onSuccessAutoSearch(data) {

    setTotalPages(data?.data?.pages);
    const localityList = data?.data?.locality.map((item) => {
      return {
        value: {
          city: item.city_name,
          locality: item.locality_name,
          // id: item.id,
        },
        label: `${item.locality_name ? item.locality_name + "," : ""} ${item.city_name
          }`,
      };
    });
    const selectedLocality = selectedOptions.map((item) => item.label);
    const filteredLocality = localityList.filter(
      (item) => !selectedLocality.includes(item.label)
    );
    const locationList = [
      {
        label: "Cities",
        options: data?.data?.city.map((item) => {
          return {
            value: {
              city: item.city_name,
              locality: item.locality_name,
              // id: item.id,
            },
            label: `${item.city_name}`,
          };
        }),
      },
      {
        label: "Localities",
        options: filteredLocality,
      },
    ];
    if (selectedOptions[0]?.value?.city) {
      locationList.shift(); //removes city options if city is selected
      pageNo === 0 && setDataLength(locationList[0].options.length + 1);
    } else {
      pageNo === 0 &&
        setDataLength(
          locationList[0]?.options?.length +
          locationList[1]?.options?.length +
          2
        );
    }
    // setAutoSearchValue(locationList);

    if (pageNo === 0) {
      // Reset the fetched data if searchInputValue changes
      setAutoSearchValue(locationList);
    } else {
      // Append new data to existing data if pageNo changes
      setAutoSearchValue((prevData) => {
        const newData = [...prevData];
        newData[0].options = newData[0]?.options?.concat(locationList[0]?.options);
        if (newData?.length > 1) {
          newData[1].options = newData[1]?.options.concat(
            locationList[1]?.options
          );
          setDataLength(
            locationList[0]?.options?.length +
            newData[0]?.options.length +
            locationList[1]?.options?.length +
            newData[1]?.options?.length +
            2
          );
        } else {
          setDataLength(
            locationList[0]?.options?.length + newData[0].options.length + 1
          );
        }
        return newData;
      });
    }
  }
  function onErrorAutoSearch(data) {

  }
  // useEffect(()=>{
  //   if(selectedOptions?.length <= 2){
  //     getSelectedSearchCity(selectedOptions);
  //   }
  // },[selectedOptions])
  return (
    <div
      style={{ ...containerStyle }}
      ref={mainRef}
      className={`${containerClass} ${isScrollable ? "position-static" : ""}   d-flex py-2 align-items-center`}
    >
      <img
        onClick={() => setShowSearchFilter(!showSearchFilter)}
        src={locationIcon}
        width={width < 576 ? 12 : null}
        alt="search_icon"
        className="ms-2"
      />

      {/* {selectedOptions?.length === 0 ? (
        <div
          onClick={() => setShowSearchFilter(true)}
        >
          <input
            ref={inputRef}
            onClick={() => {
              // setShowPropTypeSelect(false);
              // setShowBudgetSelect(false);
            }}
            style={{ ...inputStyle }}
            className={`${inputClass}  border-0 focus_none ms-2`}
            placeholder="Enter city, locality, project"
            value={searchInputValue}
            onChange={handleInput}
          />
        </div>
      ) : (
        <>
          <div
            onClick={() => setShowSearchFilter(!showSearchFilter)}
            className={`${styles.search_city_input} fs_12`}>
            <div className="d-flex align-items-center">
              {selectedOptions.map((item, index) => {
                if (index < 2)
                  return (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      key={index}
                      className={`p-1 px-1 mx-1 px-sm-2 d-flex align-items-center`}
                      style={{
                        width: "fit-content",
                        backgroundColor: "#EDF4F9",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "6rem",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          backgroundColor: "#EDF4F9",
                        }}
                        className="fs_xs_10 fs_12"
                      >
                        {item.label}
                      </div>

                      <Image
                        className="ms-2"
                        onClick={() => handleClickSelectedCity("delete", item)}
                        src={CloseIcon}
                        width={width < 576 ? 8 : 11}
                        alt="Cancel_Icon"
                      />
                    </div>
                  );
              })}
            </div>
          </div>
        </>
      )} */}
      {showSearchFilter && (
        <>
          <div
            id="scrollableSearchBar"
            ref={listRef}
            style={{ ...dropDownStyle }}
            className={`${isScrollable ? "dropdown_fullwidth" : dropDownClass} pt-2  position-absolute`}
          >
            {/* <div className="border_bottom_one_px mx-4 "></div> */}

            {selectedOptions?.map((item, index) => {
              if (index >= 2)
                return (

                  <div key={index}
                    className={`p-1 d-flex align-items-center px-1 mx-1 px-sm-2 my-1`}
                    style={{
                      width: "fit-content",
                      height: "1.8rem",
                      backgroundColor: "#EDF4F9",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "9rem",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      }}
                      className="fs_xs_10 fs_12"
                    >
                      {item.label}
                    </div>

                    <span
                      className="ps-2"
                      onClick={() => handleClickSelectedCity("delete", item)}
                    >
                      <img
                        src={CloseIcon}
                        width={width < 576 ? 8 : 11}
                        alt="Cancel_Icon"
                      />
                    </span>
                  </div>
                );
            })}
            <div className="mx-2">
              {selectedOptions?.length === 0 ? null : (
                <div
                  className={`${selectedOptions?.length > 1 ? "pt-1" : "pt-2"}`}
                >
                  <input
                    className={`dropdown_search_field w-100 p-1 focus_none ps-2`}
                    value={searchInputValue}
                    onChange={handleInput}
                    placeholder="Enter city, locality, project"
                  />
                </div>
              )}

              <InfiniteScroll
                scrollableTarget={"scrollableSearchBar"}
                // onScroll={() => {  }}
                dataLength={dataLength}
                hasMore={pageNo < totalPages}
                next={() => setPageNo((prev) => prev + 1)}
                loader={<p className="fs_14 fw_400">Loading...</p>}
                endMessage={
                  dataLength > 2 && (
                    <p className="fs_14 fw_400" style={{ textAlign: "center" }}>
                      <b>You have seen it all</b>
                    </p>
                  )
                }
              >
                {autoSearchValue.map((item) => (
                  <>
                    <div className="fs_12 text_muted mt-2">{item.label}</div>

                    <>
                      {item.options.map((data, index) => {
                        return (
                          <div
                            key={index}
                            className=""
                            onClick={() => {
                              handleClickSelectedCity("add", data);
                            }}
                          >
                            <span className="fs_13 fw_400 secondary_color mb-2 mt-1 cursor_pointer">
                              {data?.label}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  </>
                ))}
              </InfiniteScroll>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchBar;
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}
