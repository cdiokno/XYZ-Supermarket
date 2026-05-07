function FillShadow() {
  return (
    <div className="absolute inset-0 rounded-[34px] shadow-[0px_8px_40px_0px_rgba(0,0,0,0.12)]" data-name="Fill + Shadow">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[34px]">
        <div className="absolute bg-[#262626] inset-0 mix-blend-color-dodge rounded-[34px]" />
        <div className="absolute bg-[rgba(245,245,245,0.6)] inset-0 rounded-[34px]" />
      </div>
    </div>
  );
}

function GlassEffect() {
  return <div className="absolute bg-[rgba(0,0,0,0)] inset-0 rounded-[34px]" data-name="Glass Effect" />;
}

function TitleAndDescription() {
  return (
    <div className="relative shrink-0 w-full" data-name="Title and Description">
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[10px] items-center leading-[0] pb-[24px] pt-[8px] px-[8px] relative size-full text-[17px] text-black tracking-[-0.43px]">
          <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center relative shrink-0 w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
            <p className="leading-[22px]">A Short Title Is Best</p>
          </div>
          <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center relative shrink-0 w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
            <p className="leading-[22px]">A description should be a short, complete sentence.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Buttons() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Buttons">
      <div className="h-[48px] relative rounded-[100px] shrink-0 w-full" data-name="Action 1">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[13px] relative size-full">
            <div className="absolute bg-[rgba(120,120,128,0.16)] inset-0 rounded-[100px]" data-name="BG" />
            <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[#ff383c] text-[17px] tracking-[-0.43px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[22px]">Action 1</p>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[48px] relative rounded-[100px] shrink-0 w-full" data-name="Action 2">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[13px] relative size-full">
            <div className="absolute bg-[rgba(120,120,128,0.16)] inset-0 rounded-[100px]" data-name="BG" />
            <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[17px] text-black tracking-[-0.43px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[22px]">Action 2</p>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[48px] relative rounded-[100px] shrink-0 w-full" data-name="Action 3">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[13px] relative size-full">
            <div className="absolute bg-[rgba(120,120,128,0.16)] inset-0 rounded-[100px]" data-name="BG" />
            <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[17px] text-black tracking-[-0.43px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[22px]">Action 3</p>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[48px] relative rounded-[100px] shrink-0 w-full" data-name="Action 4">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[13px] relative size-full">
            <div className="absolute bg-[rgba(120,120,128,0.16)] inset-0 rounded-[100px]" data-name="BG" />
            <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[17px] text-black tracking-[-0.43px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[22px]">Action 4</p>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[48px] relative rounded-[100px] shrink-0 w-full" data-name="Action 5">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[13px] relative size-full">
            <div className="absolute bg-[rgba(120,120,128,0.16)] inset-0 rounded-[100px]" data-name="BG" />
            <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[17px] text-black tracking-[-0.43px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[22px]">Action 5</p>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[48px] relative rounded-[100px] shrink-0 w-full" data-name="Action 6">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[13px] relative size-full">
            <div className="absolute bg-[rgba(120,120,128,0.16)] inset-0 rounded-[100px]" data-name="BG" />
            <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[17px] text-black tracking-[-0.43px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[22px]">Action 6</p>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[48px] relative rounded-[100px] shrink-0 w-full" data-name="Action 7">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[13px] relative size-full">
            <div className="absolute bg-[rgba(120,120,128,0.16)] inset-0 rounded-[100px]" data-name="BG" />
            <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[17px] text-black tracking-[-0.43px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[22px]">Action 7</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActionSheet() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start justify-center p-[14px] relative size-full" data-name="Action Sheet">
      <FillShadow />
      <GlassEffect />
      <TitleAndDescription />
      <Buttons />
    </div>
  );
}