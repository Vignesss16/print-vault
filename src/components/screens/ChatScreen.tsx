'use client';

import React, { useState } from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';
import { ColorMode } from '@/types/printvault';

export const ChatScreen: React.FC = () => {
  const {
    activeChatSession,
    acceptChatRequest,
    declineChatRequest,
    sendChatMessage,
    sendDocumentInChat,
    setCurrentScreen,
    currentUser,
    isShopkeeperMode,
    setIsShopkeeperMode,
    triggerToast,
    countdown,
    formatCountdown,
  } = usePrintVault();

  const [inputMessage, setInputMessage] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // Document Send Form State
  const [selectedFileName, setSelectedFileName] = useState('e-Aadhaar_Card_Tanishq.pdf');
  const [fileSize, setFileSize] = useState('1.4 MB');
  const [pageCount, setPageCount] = useState(2);
  const [copies, setCopies] = useState(2);
  const [colorMode, setColorMode] = useState<ColorMode>('bw');
  const [isMaskedAadhaar, setIsMaskedAadhaar] = useState(true);
  const [printNote, setPrintNote] = useState('Please print back-to-back (duplex)');

  if (!activeChatSession) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <div className="w-12 h-12 rounded-2xl bg-[#f5f3ef] flex items-center justify-center text-[#767588] mb-3">
          <span className="material-symbols-outlined text-[24px]">chat_bubble_outline</span>
        </div>
        <h3 className="font-heading font-semibold text-[16px] text-[#1b1c1a]">No Active Chat</h3>
        <p className="font-sans text-[13px] text-[#6b6760] mt-1 max-w-[280px]">
          Select a nearby Xerox shop to connect with the operator and send your documents.
        </p>
        <button
          type="button"
          onClick={() => setCurrentScreen('home')}
          className="mt-4 px-5 py-2.5 rounded-full bg-[#3d3bf3] text-white text-[13px] font-sans font-semibold hover:bg-[#2e2cd4] transition-all cursor-pointer"
        >
          View Nearby Xerox Stores
        </button>
      </div>
    );
  }

  const { shop, customer, status, messages } = activeChatSession;
  const operatorName = shop.operatorName || 'Mohan Kumar';
  const customerName = customer.name || currentUser?.name || 'Tanishq Mudaliyar';

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendChatMessage(inputMessage);
    setInputMessage('');
  };

  const handleSendDocument = () => {
    sendDocumentInChat({
      fileName: selectedFileName,
      fileSize,
      pageCount,
      copies,
      colorMode,
      isMaskedAadhaar,
      note: printNote,
    });
    setShowDocumentModal(false);
  };

  return (
    <div className="flex flex-col w-full h-full pb-6">
      {/* Top Shopkeeper & Session Header Bar */}
      <div className="bg-white rounded-3xl p-4 border border-[#ece8e1] shadow-xs mb-4">
        <div className="flex items-center justify-between gap-3">
          {/* Shop and Operator Info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setCurrentScreen('home')}
              className="w-8 h-8 rounded-full bg-[#f5f3ef] hover:bg-[#efeeea] flex items-center justify-center text-[#1b1c1a] active:scale-95 transition-all cursor-pointer shrink-0"
              title="Back to Map"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>

            <div className="relative shrink-0">
              <img
                src={shop.image}
                alt={shop.name}
                className="w-10 h-10 rounded-2xl object-cover border border-[#ece8e1]"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
            </div>

            <div className="min-w-0">
              <h3 className="font-heading font-bold text-[15px] text-[#1b1c1a] truncate leading-tight">
                {shop.name}
              </h3>
              <p className="font-sans text-[11px] text-[#454556] truncate">
                Operator: <span className="font-semibold text-[#1b1c1a]">{operatorName}</span> • {shop.distance}
              </p>
            </div>
          </div>

          {/* Shopkeeper Perspective Simulator Switch */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsShopkeeperMode(!isShopkeeperMode);
                triggerToast(
                  !isShopkeeperMode
                    ? `Switched to Shopkeeper View (${operatorName})`
                    : `Switched to Customer View (${customerName})`
                );
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-sans font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isShopkeeperMode
                  ? 'bg-[#ffe8d6] text-[#8a3800] border-[#ffb27d]'
                  : 'bg-[#f5f3ef] text-[#454556] border-[#ece8e1] hover:bg-[#efeeea]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {isShopkeeperMode ? 'storefront' : 'person'}
              </span>
              <span>{isShopkeeperMode ? 'Shopkeeper View' : 'Customer View'}</span>
            </button>
          </div>
        </div>

        {/* Customer Context Ribbon */}
        <div className="mt-3 pt-2.5 border-t border-[#ece8e1] flex items-center justify-between text-[11px] text-[#6b6760]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="material-symbols-outlined text-[15px] text-[#3d3bf3]">badge</span>
            <span>Customer: <strong className="text-[#1b1c1a]">{customerName}</strong></span>
          </div>
          <span className="font-sans text-[10px] bg-[#e1e0ff] text-[#07006c] px-2.5 py-0.5 rounded-full font-medium shrink-0">
            Secure Session
          </span>
        </div>
      </div>

      {/* PENDING STATE: Customer waiting for Shopkeeper to Accept */}
      {status === 'pending' && (
        <div className="bg-white rounded-3xl p-6 border border-[#ece8e1] shadow-xs mb-4 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e1e0ff] text-[#3d3bf3] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px] animate-spin">sync</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span className="font-sans text-[11px] text-amber-700 font-semibold uppercase tracking-wide">
                  Waiting for Shopkeeper
                </span>
              </div>
              <h4 className="font-heading font-semibold text-[17px] text-[#1b1c1a] mt-1">
                Print Request Sent to {operatorName}
              </h4>
              <p className="font-sans text-[13px] text-[#6b6760] mt-1 leading-relaxed">
                Your request was sent to <strong>{shop.name}</strong>. The chat and document upload will pop up automatically as soon as <strong>{operatorName}</strong> accepts on the shopkeeper terminal.
              </p>
            </div>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="p-4 bg-[#fbf9f5] rounded-2xl border border-[#ece8e1] space-y-3 text-[12px]">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                ✓
              </div>
              <div className="flex-1">
                <span className="font-sans font-semibold text-[#1b1c1a] block">
                  Request Dispatched
                </span>
                <span className="font-sans text-[11px] text-[#6b6760]">
                  {shop.name} • {shop.distance}
                </span>
              </div>
            </div>

            <div className="ml-3 w-0.5 h-3 bg-[#c0c1ff]"></div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0 animate-pulse">
                •
              </div>
              <div className="flex-1">
                <span className="font-sans font-semibold text-[#1b1c1a] block">
                  Shopkeeper Acceptance
                </span>
                <span className="font-sans text-[11px] text-amber-700 font-medium">
                  Waiting for {operatorName} to accept on the shopkeeper terminal...
                </span>
              </div>
            </div>

            <div className="ml-3 w-0.5 h-3 bg-[#ece8e1]"></div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="w-6 h-6 rounded-full bg-[#efeeea] text-[#767588] flex items-center justify-center text-[11px] font-bold shrink-0">
                3
              </div>
              <div className="flex-1">
                <span className="font-sans font-semibold text-[#1b1c1a] block">
                  Chat &amp; Document Send
                </span>
                <span className="font-sans text-[11px] text-[#8a8780]">
                  Attach file, set copies &amp; receive pickup PIN
                </span>
              </div>
            </div>
          </div>

          {/* Action Row for Customer */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                declineChatRequest();
                setCurrentScreen('home');
                triggerToast('Print request cancelled.');
              }}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#ffebee] text-[#ba1a1a] font-sans text-[12px] font-medium border border-[#ffcdd2] transition-all cursor-pointer text-center"
            >
              Cancel Request
            </button>

            {/* Switch Helper to view shopkeeper screen */}
            <button
              type="button"
              onClick={() => setCurrentScreen('shopkeeper_dashboard')}
              className="px-4 py-2.5 rounded-xl bg-[#07006c] hover:bg-[#12009e] text-white font-sans text-[12px] font-medium transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">storefront</span>
              <span>Open Shopkeeper Portal to Accept</span>
            </button>
          </div>
        </div>
      )}

      {/* DECLINED STATE */}
      {status === 'declined' && (
        <div className="bg-white rounded-3xl p-6 border border-[#ffdad6] shadow-sm mb-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]">do_not_disturb_on</span>
          </div>
          <h4 className="font-heading font-semibold text-[16px] text-[#ba1a1a]">
            Request Declined
          </h4>
          <p className="font-sans text-[12px] text-[#6b6760] max-w-[300px] mx-auto">
            {shop.name} is unable to take new print orders right now. Please select another nearby shop.
          </p>
          <button
            type="button"
            onClick={() => setCurrentScreen('home')}
            className="px-5 py-2 rounded-full bg-[#1b1c1a] text-white text-[12px] font-sans font-semibold hover:bg-black transition-all cursor-pointer"
          >
            Back to GPS Map
          </button>
        </div>
      )}

      {/* ACCEPTED STATE: ACTIVE CHAT TIMELINE */}
      {status === 'accepted' && (
        <>
          {/* Messages Stream Container */}
          <div className="flex-1 bg-[#f5f3ef]/80 rounded-3xl p-4 border border-[#ece8e1] space-y-3 overflow-y-auto min-h-[340px] max-h-[500px] mb-3 shadow-inner">
            {messages.map((msg) => {
              // System Announcement Message
              if (msg.senderRole === 'system') {
                return (
                  <div key={msg.id} className="text-center py-2 animate-in fade-in duration-200">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold bg-[#e1e0ff] text-[#07006c] px-3 py-1 rounded-full border border-[#c0c1ff]">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isCustomer = msg.senderRole === 'customer';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-150`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="font-sans text-[11px] font-semibold text-[#454556]">
                      {msg.senderName}
                    </span>
                    <span className="font-mono text-[9px] text-[#767588]">{msg.timestamp}</span>
                  </div>

                  {/* Document Card Attachment Message */}
                  {msg.document ? (
                    <div className="w-full max-w-[340px] bg-white rounded-2xl p-4 border-2 border-[#3d3bf3] shadow-md space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#e1e0ff] text-[#3d3bf3] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">description</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-heading font-bold text-[13px] text-[#1b1c1a] truncate">
                            {msg.document.fileName}
                          </h5>
                          <p className="font-sans text-[11px] text-[#454556]">
                            {msg.document.fileSize} • {msg.document.pageCount} pgs • {msg.document.copies} copies
                          </p>
                        </div>
                      </div>

                      {/* Aadhaar Masking Indicator */}
                      {msg.document.isMaskedAadhaar && (
                        <div className="bg-[#ddf5e6] text-[#0a542a] px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">verified_user</span>
                          <span>National ID Masked (XXXX-XXXX-4892)</span>
                        </div>
                      )}

                      {/* Ephemeral Token Chip */}
                      <div className="bg-[#f5f3ef] p-2.5 rounded-xl border border-[#ece8e1] flex items-center justify-between">
                        <div>
                          <span className="font-sans text-[9px] uppercase tracking-wide text-[#767588] block">
                            PICKUP PIN
                          </span>
                          <span className="font-mono text-[16px] font-bold text-[#3d3bf3]">
                            {msg.document.token}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-sans text-[9px] uppercase tracking-wide text-[#767588] block">
                            EST. TOTAL
                          </span>
                          <span className="font-mono text-[14px] font-bold text-[#1b1c1a]">
                            ₹{msg.document.totalPrice}
                          </span>
                        </div>
                      </div>

                      {/* Actions on Sent Document */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setCurrentScreen('live_tracker')}
                          className="py-1.5 px-3 rounded-lg bg-[#3d3bf3] text-white text-[11px] font-sans font-semibold hover:bg-[#2e2cd4] transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">sensors</span>
                          <span>Live Tracker</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCurrentScreen('shop_qr')}
                          className="py-1.5 px-3 rounded-lg bg-[#f5f3ef] hover:bg-[#efeeea] text-[#1b1c1a] text-[11px] font-sans font-medium border border-[#ece8e1] transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">qr_code_2</span>
                          <span>Show QR</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Regular Text Bubble */
                    <div
                      className={`max-w-[300px] px-4 py-2.5 rounded-2xl text-[13px] font-sans leading-relaxed shadow-xs ${
                        isCustomer
                          ? 'bg-[#3d3bf3] text-white rounded-tr-none'
                          : 'bg-white text-[#1b1c1a] border border-[#ece8e1] rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Row: Send Document CTA & Text Composer */}
          <div className="space-y-2">
            {/* Direct Send Document CTA Button */}
            <button
              type="button"
              onClick={() => setShowDocumentModal(true)}
              className="w-full py-3 px-4 rounded-2xl bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[13px] font-semibold flex items-center justify-between shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[19px]">upload_file</span>
                <span>Send Document to Print</span>
              </div>
              <span className="font-sans text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                ₹{shop.pricePerBw || 2}/pg
              </span>
            </button>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDocumentModal(true)}
                className="w-11 h-11 rounded-2xl bg-white border border-[#ece8e1] flex items-center justify-center text-[#454556] hover:text-[#3d3bf3] hover:border-[#3d3bf3] transition-all cursor-pointer shrink-0"
                title="Attach Document"
              >
                <span className="material-symbols-outlined text-[20px]">attach_file</span>
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Message ${operatorName}...`}
                className="flex-1 h-11 px-4 bg-white border border-[#ece8e1] rounded-2xl font-sans text-[13px] text-[#1b1c1a] focus:outline-none focus:border-[#3d3bf3] transition-all"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="w-11 h-11 rounded-2xl bg-[#3d3bf3] hover:bg-[#2e2cd4] disabled:bg-[#f5f3ef] disabled:text-[#767588] text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[19px]">send</span>
              </button>
            </form>
          </div>
        </>
      )}

      {/* DOCUMENT SELECTION & SENDER MODAL */}
      {showDocumentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full sm:max-w-[440px] bg-[#fbf9f5] rounded-t-[32px] sm:rounded-[32px] p-6 border border-[#ece8e1] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#ece8e1]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#3d3bf3] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-[15px] text-[#1b1c1a]">
                    Send Document to Print
                  </h4>
                  <p className="font-sans text-[11px] text-[#6b6760]">
                    {shop.name} • {operatorName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDocumentModal(false)}
                className="w-8 h-8 rounded-full bg-[#f5f3ef] hover:bg-[#efeeea] flex items-center justify-center text-[#1b1c1a] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Document Quick Selection */}
            <div>
              <label className="block font-sans text-[12px] font-semibold text-[#1b1c1a] mb-2">
                Choose Document File
              </label>
              <div className="space-y-2">
                {[
                  { name: `e-Aadhaar_Card_${customerName.split(' ')[0]}.pdf`, size: '1.4 MB', pages: 2, isAadhaar: true },
                  { name: 'College_Project_Final_Submission.pdf', size: '3.8 MB', pages: 12, isAadhaar: false },
                  { name: 'Rental_Agreement_Indiranagar.pdf', size: '2.1 MB', pages: 5, isAadhaar: false },
                ].map((doc) => (
                  <div
                    key={doc.name}
                    onClick={() => {
                      setSelectedFileName(doc.name);
                      setFileSize(doc.size);
                      setPageCount(doc.pages);
                      setIsMaskedAadhaar(doc.isAadhaar);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedFileName === doc.name
                        ? 'bg-[#e1e0ff]/50 border-[#3d3bf3] shadow-xs'
                        : 'bg-white border-[#ece8e1] hover:bg-[#f5f3ef]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="material-symbols-outlined text-[20px] text-[#3d3bf3]">
                        description
                      </span>
                      <div className="min-w-0">
                        <p className="font-sans text-[12px] font-semibold text-[#1b1c1a] truncate">
                          {doc.name}
                        </p>
                        <p className="font-sans text-[10px] text-[#767588]">
                          {doc.size} • {doc.pages} pages
                        </p>
                      </div>
                    </div>
                    {selectedFileName === doc.name && (
                      <span className="material-symbols-outlined text-[18px] text-[#3d3bf3]">
                        check_circle
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Print Options: Copies & Color Mode */}
            <div className="grid grid-cols-2 gap-3">
              {/* Copies */}
              <div>
                <label className="block font-sans text-[11px] font-semibold text-[#1b1c1a] mb-1">
                  Copies
                </label>
                <div className="flex items-center bg-white border border-[#ece8e1] rounded-2xl p-1 justify-between">
                  <button
                    type="button"
                    onClick={() => setCopies((c) => Math.max(1, c - 1))}
                    className="w-8 h-8 rounded-xl bg-[#f5f3ef] hover:bg-[#efeeea] font-bold text-[14px] flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono text-[14px] font-bold text-[#1b1c1a]">
                    {copies}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCopies((c) => c + 1)}
                    className="w-8 h-8 rounded-xl bg-[#f5f3ef] hover:bg-[#efeeea] font-bold text-[14px] flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Color Mode */}
              <div>
                <label className="block font-sans text-[11px] font-semibold text-[#1b1c1a] mb-1">
                  Color Mode
                </label>
                <div className="grid grid-cols-2 bg-white border border-[#ece8e1] rounded-2xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setColorMode('bw')}
                    className={`py-1.5 text-[11px] font-sans font-semibold rounded-xl transition-all cursor-pointer ${
                      colorMode === 'bw'
                        ? 'bg-[#3d3bf3] text-white shadow-2xs'
                        : 'text-[#454556]'
                    }`}
                  >
                    B&amp;W
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode('color')}
                    className={`py-1.5 text-[11px] font-sans font-semibold rounded-xl transition-all cursor-pointer ${
                      colorMode === 'color'
                        ? 'bg-[#3d3bf3] text-white shadow-2xs'
                        : 'text-[#454556]'
                    }`}
                  >
                    Color
                  </button>
                </div>
              </div>
            </div>

            {/* Aadhaar Privacy Shield Toggle */}
            <div className="p-3 rounded-2xl bg-white border border-[#ece8e1] flex items-center justify-between">
              <div>
                <span className="font-sans text-[12px] font-semibold text-[#1b1c1a] block">
                  Aadhaar / ID Auto-Masking
                </span>
                <span className="font-sans text-[10px] text-[#454556]">
                  Obscures first 8 digits before transmission
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMaskedAadhaar}
                  onChange={(e) => setIsMaskedAadhaar(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-[#eae8e4] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3d3bf3]"></div>
              </label>
            </div>

            {/* Note to Shopkeeper */}
            <div>
              <label className="block font-sans text-[11px] font-semibold text-[#1b1c1a] mb-1">
                Instruction for {operatorName}
              </label>
              <input
                type="text"
                value={printNote}
                onChange={(e) => setPrintNote(e.target.value)}
                placeholder="e.g. Duplex back-to-back, staple top left"
                className="w-full h-10 px-3 bg-white border border-[#ece8e1] rounded-xl font-sans text-[12px] text-[#1b1c1a] focus:outline-none focus:border-[#3d3bf3]"
              />
            </div>

            {/* Estimated Cost calculation */}
            <div className="p-3 rounded-2xl bg-[#e1e0ff]/50 border border-[#c0c1ff] flex items-center justify-between text-[12px]">
              <span className="font-sans text-[#07006c]">Total Printing Fee</span>
              <span className="font-mono font-bold text-[16px] text-[#3d3bf3]">
                ₹{((colorMode === 'bw' ? (shop.pricePerBw || 2) : (shop.pricePerColor || 5)) * pageCount * copies).toFixed(2)}
              </span>
            </div>

            {/* Send Document CTA */}
            <button
              type="button"
              onClick={handleSendDocument}
              className="w-full h-11 rounded-xl bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[13px] font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>Send Document</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
