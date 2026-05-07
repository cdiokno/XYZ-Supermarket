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

function Contents() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-center min-w-px relative" data-name="Contents">
      <div className="h-px relative shrink-0 w-full" data-name="_Separator">
        <div aria-hidden="true" className="absolute border-[#e6e6e6] border-solid border-t inset-[-1px_0_0_0] pointer-events-none" />
      </div>
      <div className="flex flex-[1_0_0] flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] min-h-px relative text-[17px] text-black tracking-[-0.43px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20px]">Value</p>
      </div>
    </div>
  );
}

function Contents1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-center min-w-px relative" data-name="Contents">
      <div className="h-px relative shrink-0 w-full" data-name="_Separator">
        <div aria-hidden="true" className="absolute border-[#e6e6e6] border-solid border-t inset-[-1px_0_0_0] pointer-events-none" />
      </div>
      <div className="flex flex-[1_0_0] flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] min-h-px relative text-[17px] text-[rgba(60,60,67,0.3)] tracking-[-0.43px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20px]">Value</p>
      </div>
    </div>
  );
}

function Fields() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Fields">
      <div className="absolute bg-[rgba(120,120,128,0.16)] inset-0 rounded-[26px]" data-name="_Text Field Background" />
      <div className="h-[52px] relative shrink-0 w-full" data-name="Text Field">
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex items-center px-[16px] relative size-full">
            <Contents />
          </div>
        </div>
      </div>
      <div className="h-[52px] relative shrink-0 w-full" data-name="Text Field">
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex items-center px-[16px] relative size-full">
            <Contents1 />
          </div>
        </div>
      </div>
    </div>
  );
}

function TextFieldS() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[19px] relative rounded-[26px] shrink-0 w-full" data-name="Text Field(s)">
      <Fields />
    </div>
  );
}

function Buttons() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-name="Buttons">
      <div className="flex-[1_0_0] h-[48px] min-w-px relative rounded-[100px]" data-name="Button 1">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[13px] relative size-full">
            <div className="absolute bg-[rgba(120,120,128,0.16)] inset-0 rounded-[100px]" data-name="BG" />
            <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[17px] text-black tracking-[-0.43px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[22px]">Secondary</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[rgba(255,255,255,0.6)] flex-[1_0_0] min-w-px relative rounded-[100px]" data-name="Button 2">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[13px] relative size-full">
            <div className="absolute bg-[#08f] inset-0 rounded-[100px]" data-name="BG" />
            <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[17px] text-white tracking-[-0.43px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[22px]">Primary</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Alert() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start p-[14px] relative size-full" data-name="Alert">
      <FillShadow />
      <GlassEffect />
      <TitleAndDescription />
      <TextFieldS />
      <Buttons />
    </div>
  );
}