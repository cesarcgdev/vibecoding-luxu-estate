"use client";

import React, { useState } from "react";

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FiltersModal({ isOpen, onClose }: FiltersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modal Overlay */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Main Modal Container */}
      <main className="relative z-20 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-30">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Filters</h1>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          >
            <span className="material-icons">close</span>
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto hide-scroll p-8 space-y-10">
          {/* Section 1: Location */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Location</label>
            <div className="relative group">
              <span className="material-icons absolute left-4 top-3.5 text-gray-400 group-focus-within:text-[#006611] transition-colors">location_on</span>
              <input 
                className="w-full pl-12 pr-4 py-3 bg-[#f5f8f6] dark:bg-gray-800 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#006611] focus:bg-white dark:focus:bg-gray-800 transition-all shadow-sm outline-none" 
                placeholder="City, neighborhood, or address" 
                type="text" 
                defaultValue="San Francisco, CA"
              />
            </div>
          </section>

          {/* Section 2: Price Range */}
          <section>
            <div className="flex justify-between items-end mb-4">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price Range</label>
              <span className="text-sm font-medium text-[#006611]">$1.2M – $4.5M</span>
            </div>
            <div className="relative h-12 flex items-center mb-6 px-2">
              {/* Custom Fake Slider Visual */}
              <div className="absolute w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#006611] w-1/3 ml-[20%]"></div>
              </div>
              {/* Handles (Visual only for mock) */}
              <div className="absolute left-[20%] w-6 h-6 bg-white border-2 border-[#006611] rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform -ml-3 z-10"></div>
              <div className="absolute left-[53%] w-6 h-6 bg-white border-2 border-[#006611] rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform -ml-3 z-10"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#f5f8f6] dark:bg-gray-800 p-3 rounded-lg border border-transparent focus-within:border-[#006611]/30 transition-colors">
                <label className="block text-[10px] text-gray-500 uppercase font-medium mb-1">Min Price</label>
                <div className="flex items-center">
                  <span className="text-gray-400 mr-1">$</span>
                  <input className="w-full bg-transparent border-0 p-0 text-gray-900 dark:text-white font-medium focus:ring-0 text-sm outline-none" type="text" defaultValue="1,200,000"/>
                </div>
              </div>
              <div className="bg-[#f5f8f6] dark:bg-gray-800 p-3 rounded-lg border border-transparent focus-within:border-[#006611]/30 transition-colors">
                <label className="block text-[10px] text-gray-500 uppercase font-medium mb-1">Max Price</label>
                <div className="flex items-center">
                  <span className="text-gray-400 mr-1">$</span>
                  <input className="w-full bg-transparent border-0 p-0 text-gray-900 dark:text-white font-medium focus:ring-0 text-sm outline-none" type="text" defaultValue="4,500,000"/>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Property Details */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Property Type */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Property Type</label>
              <div className="relative">
                <select className="w-full bg-[#f5f8f6] dark:bg-gray-800 border-0 rounded-lg py-3 pl-4 pr-10 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#006611] cursor-pointer outline-none">
                  <option>Any Type</option>
                  <option>House</option>
                  <option>Apartment</option>
                  <option>Condo</option>
                  <option>Townhouse</option>
                </select>
                <span className="material-icons absolute right-3 top-3 text-gray-400 pointer-events-none">expand_more</span>
              </div>
            </div>
            {/* Rooms */}
            <div className="space-y-4">
              {/* Beds */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Bedrooms</span>
                <div className="flex items-center space-x-3 bg-[#f5f8f6] dark:bg-gray-800 rounded-full p-1">
                  <button className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-gray-500 hover:text-[#006611] disabled:opacity-50 transition-colors">
                    <span className="material-icons text-base">remove</span>
                  </button>
                  <span className="text-sm font-semibold w-4 text-center">3+</span>
                  <button className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-[#006611] hover:bg-[#006611] hover:text-white transition-colors">
                    <span className="material-icons text-base">add</span>
                  </button>
                </div>
              </div>
              {/* Baths */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Bathrooms</span>
                <div className="flex items-center space-x-3 bg-[#f5f8f6] dark:bg-gray-800 rounded-full p-1">
                  <button className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-gray-500 hover:text-[#006611] transition-colors">
                    <span className="material-icons text-base">remove</span>
                  </button>
                  <span className="text-sm font-semibold w-4 text-center">2+</span>
                  <button className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-[#006611] hover:bg-[#006611] hover:text-white transition-colors">
                    <span className="material-icons text-base">add</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Amenities */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Amenities &amp; Features</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Toggle Chip Active */}
              <label className="cursor-pointer group relative">
                <input defaultChecked className="peer sr-only" type="checkbox"/>
                <div className="h-full px-4 py-3 rounded-lg border border-[#006611] bg-[#006611]/5 dark:bg-[#006611]/20 text-[#006611] font-medium text-sm flex items-center justify-center gap-2 transition-all peer-checked:bg-[#006611]/10 peer-checked:border-[#006611] peer-checked:text-[#006611] hover:bg-[#006611]/10">
                  <span className="material-icons text-lg">pool</span>
                  Swimming Pool
                </div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#006611] rounded-full opacity-100 transition-opacity"></div>
              </label>
              
              {/* Toggle Chip Inactive */}
              <label className="cursor-pointer group">
                <input className="peer sr-only" type="checkbox"/>
                <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 dark:hover:border-gray-600 peer-checked:border-[#006611] peer-checked:bg-[#006611]/5 peer-checked:text-[#006611]">
                  <span className="material-icons text-lg text-gray-400 group-hover:text-gray-500 peer-checked:text-[#006611]">fitness_center</span>
                  Gym
                </div>
              </label>

              <label className="cursor-pointer group">
                <input className="peer sr-only" type="checkbox"/>
                <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 dark:hover:border-gray-600 peer-checked:border-[#006611] peer-checked:bg-[#006611]/5 peer-checked:text-[#006611]">
                  <span className="material-icons text-lg text-gray-400 group-hover:text-gray-500 peer-checked:text-[#006611]">local_parking</span>
                  Parking
                </div>
              </label>

              <label className="cursor-pointer group">
                <input className="peer sr-only" type="checkbox"/>
                <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 dark:hover:border-gray-600 peer-checked:border-[#006611] peer-checked:bg-[#006611]/5 peer-checked:text-[#006611]">
                  <span className="material-icons text-lg text-gray-400 group-hover:text-gray-500 peer-checked:text-[#006611]">ac_unit</span>
                  Air Conditioning
                </div>
              </label>

              <label className="cursor-pointer group relative">
                <input defaultChecked className="peer sr-only" type="checkbox"/>
                <div className="h-full px-4 py-3 rounded-lg border border-[#006611] bg-[#006611]/5 dark:bg-[#006611]/20 text-[#006611] font-medium text-sm flex items-center justify-center gap-2 transition-all peer-checked:bg-[#006611]/10 peer-checked:border-[#006611] peer-checked:text-[#006611] hover:bg-[#006611]/10">
                  <span className="material-icons text-lg">wifi</span>
                  High-speed Wifi
                </div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#006611] rounded-full opacity-100 transition-opacity"></div>
              </label>

              <label className="cursor-pointer group">
                <input className="peer sr-only" type="checkbox"/>
                <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 dark:hover:border-gray-600 peer-checked:border-[#006611] peer-checked:bg-[#006611]/5 peer-checked:text-[#006611]">
                  <span className="material-icons text-lg text-gray-400 group-hover:text-gray-500 peer-checked:text-[#006611]">deck</span>
                  Patio / Terrace
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-8 py-6 sticky bottom-0 z-30 flex items-center justify-between">
          <button className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors underline decoration-gray-300 underline-offset-4">
            Clear all filters
          </button>
          <button 
            onClick={onClose}
            className="bg-[#006611] hover:bg-[#006611]/90 text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-[#006611]/30 transition-all hover:shadow-[#006611]/40 flex items-center gap-2 transform active:scale-95"
          >
            Show 124 Homes
            <span className="material-icons text-sm">arrow_forward</span>
          </button>
        </footer>
      </main>
    </div>
  );
}
