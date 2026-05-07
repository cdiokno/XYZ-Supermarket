function ContentArea() {
  return (
    <div className="absolute bg-white drop-shadow-[0px_0px_16px_rgba(0,0,0,0.2)] inset-[-0.5px_0] rounded-[30px]" data-name="Content Area">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center px-[125px] py-[165px] relative size-full">
          <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[17px] text-[rgba(0,0,0,0.6)] text-center tracking-[-0.43px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
            Content Area
          </p>
        </div>
      </div>
    </div>
  );
}

function FillShadow() {
  return (
    <div className="absolute inset-0 rounded-[32px] shadow-[0px_8px_40px_0px_rgba(0,0,0,0.12)]" data-name="Fill + Shadow">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[32px]">
        <div className="absolute bg-[#262626] inset-0 mix-blend-color-dodge rounded-[32px]" />
        <div className="absolute bg-[rgba(245,245,245,0.6)] inset-0 rounded-[32px]" />
      </div>
    </div>
  );
}

function GlassEffect() {
  return <div className="absolute bg-[rgba(0,0,0,0)] inset-0 rounded-[32px]" data-name="Glass Effect" />;
}

function Bg() {
  return <div className="absolute bg-[#ededed] inset-0 rounded-[20px]" data-name="BG" />;
}

function QuickActions() {
  return (
    <div className="relative shrink-0 w-full" data-name="Quick Actions">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[6px] items-center px-[10px] relative size-full">
          <div className="flex-[1_0_0] h-[56px] min-w-px relative rounded-[20px]" data-name="Action 1">
            <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
              <div className="content-stretch flex flex-col gap-[5px] items-center px-[4px] py-[6px] relative size-full">
                <Bg />
                <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal h-[22px] justify-center leading-[0] min-w-full relative shrink-0 text-[#1a1a1a] text-[13px] text-center w-[min-content]" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss16'" }}>
                  <p className="leading-[15px]">{`\u{1002C2}`}</p>
                </div>
                <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[18px] min-w-full overflow-hidden relative shrink-0 text-[#1a1a1a] text-[12px] text-center text-ellipsis w-[min-content] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Label
                </p>
              </div>
            </div>
          </div>
          <div className="flex-[1_0_0] h-[56px] min-w-px relative rounded-[20px]" data-name="Action 2">
            <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
              <div className="content-stretch flex flex-col gap-[5px] items-center px-[4px] py-[6px] relative size-full text-[#1a1a1a] text-center">
                <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal h-[22px] justify-center leading-[0] min-w-full relative shrink-0 text-[13px] w-[min-content]" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss16'" }}>
                  <p className="leading-[15px]">{`\u{1002C2}`}</p>
                </div>
                <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[18px] min-w-full overflow-hidden relative shrink-0 text-[12px] text-ellipsis w-[min-content] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Label
                </p>
              </div>
            </div>
          </div>
          <div className="flex-[1_0_0] h-[56px] min-w-px relative rounded-[20px]" data-name="Action 3">
            <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
              <div className="content-stretch flex flex-col gap-[5px] items-center px-[4px] py-[6px] relative size-full text-[#ff383c] text-center">
                <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal h-[22px] justify-center leading-[0] min-w-full relative shrink-0 text-[13px] w-[min-content]" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss16'" }}>
                  <p className="leading-[15px]">{`\u{1002C2}`}</p>
                </div>
                <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[18px] min-w-full overflow-hidden relative shrink-0 text-[12px] text-ellipsis w-[min-content] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Desctructive
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Separator() {
  return <div className="bg-[#e6e6e6] h-px relative shrink-0 w-full" data-name="Separator" />;
}

function LabelAndSubtitle() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start justify-center min-w-px py-[10px] relative" data-name="Label and Subtitle">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#1a1a1a] text-[17px] tracking-[-0.43px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20px]">Label</p>
      </div>
    </div>
  );
}

function Leading() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Leading">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#1a1a1a] text-[17px] text-center w-[28px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[22px]">{`\u{1004D4}`}</p>
      </div>
      <LabelAndSubtitle />
    </div>
  );
}

function Shortcuts() {
  return (
    <div className="content-stretch flex font-['SF_Pro:Medium',sans-serif] font-[510] gap-px items-center leading-[0] relative shrink-0 text-[#727272] text-[15px] text-center" data-name="Shortcuts">
      <div className="flex flex-col justify-center relative shrink-0 w-[14px]" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
        <p className="leading-[20px]">{`\u{100194}`}</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 w-[14px]" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
        <p className="leading-[20px]">A</p>
      </div>
    </div>
  );
}

function LabelAndSubtitle1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start justify-center min-w-px py-[10px] relative" data-name="Label and Subtitle">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#bfbfbf] text-[17px] tracking-[-0.43px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20px]">Disabled Action</p>
      </div>
    </div>
  );
}

function Leading1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Leading">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#bfbfbf] text-[17px] text-center w-[28px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[22px]">{`\u{1004D4}`}</p>
      </div>
      <LabelAndSubtitle1 />
    </div>
  );
}

function LabelAndSubtitle2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start justify-center min-w-px py-[10px] relative" data-name="Label and Subtitle">
      <div className="flex flex-col justify-center relative shrink-0 text-[#ff383c] text-[17px] tracking-[-0.43px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20px]">Destructive Action</p>
      </div>
      <div className="flex flex-col justify-center overflow-hidden relative shrink-0 text-[#727272] text-[13px] text-ellipsis w-full whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[18px] overflow-hidden text-ellipsis">Subtitle</p>
      </div>
    </div>
  );
}

function Leading2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] font-['SF_Pro:Regular',sans-serif] font-normal gap-[8px] items-center leading-[0] min-w-px relative" data-name="Leading">
      <div className="flex flex-col justify-center relative shrink-0 text-[#ff383c] text-[17px] text-center w-[28px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[22px]">{`\u{1004D4}`}</p>
      </div>
      <LabelAndSubtitle2 />
    </div>
  );
}

function Separator1() {
  return <div className="bg-[#e6e6e6] h-px relative shrink-0 w-full" data-name="Separator" />;
}

function LabelAndSubtitle3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start justify-center min-w-px py-[10px] relative" data-name="Label and Subtitle">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#1a1a1a] text-[17px] tracking-[-0.43px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20px]">Action</p>
      </div>
    </div>
  );
}

function Leading3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Leading">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#1a1a1a] text-[17px] text-center w-[28px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[22px]">{`\u{1004D4}`}</p>
      </div>
      <LabelAndSubtitle3 />
    </div>
  );
}

function Separator2() {
  return <div className="bg-[#e6e6e6] h-px relative shrink-0 w-full" data-name="Separator" />;
}

function LabelAndSubtitle4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start justify-center min-w-px py-[10px] relative" data-name="Label and Subtitle">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#1a1a1a] text-[17px] tracking-[-0.43px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20px]">Submenu</p>
      </div>
    </div>
  );
}

function Leading4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Leading">
      <LabelAndSubtitle4 />
    </div>
  );
}

function LabelAndSubtitle5() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start justify-center min-w-px py-[10px] relative" data-name="Label and Subtitle">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#1a1a1a] text-[17px] tracking-[-0.43px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20px]">Submenu</p>
      </div>
    </div>
  );
}

function Leading5() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Leading">
      <LabelAndSubtitle5 />
    </div>
  );
}

function LabelAndSubtitle6() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start justify-center min-w-px py-[10px] relative" data-name="Label and Subtitle">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#1a1a1a] text-[17px] tracking-[-0.43px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20px]">Submenu with a long title</p>
      </div>
    </div>
  );
}

function Leading6() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Leading">
      <LabelAndSubtitle6 />
    </div>
  );
}

function Separator3() {
  return <div className="bg-[#e6e6e6] h-px relative shrink-0 w-full" data-name="Separator" />;
}

function LabelAndSubtitle7() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start justify-center min-w-px py-[10px] relative" data-name="Label and Subtitle">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#1a1a1a] text-[17px] tracking-[-0.43px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20px]">Action</p>
      </div>
    </div>
  );
}

function Leading7() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Leading">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#1a1a1a] text-[17px] text-center w-[28px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[22px]">{`\u{1004D4}`}</p>
      </div>
      <LabelAndSubtitle7 />
    </div>
  );
}

function MenuItems() {
  return (
    <div className="relative shrink-0 w-full" data-name="Menu Items">
      <div className="content-stretch flex flex-col items-start px-[16px] relative size-full">
        <div className="h-[21px] relative shrink-0 w-full" data-name="Separator">
          <div className="flex flex-col items-center justify-center size-full">
            <div className="content-stretch flex flex-col items-center justify-center px-[8px] relative size-full">
              <Separator />
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Item">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex gap-[6px] items-center pl-[6px] pr-[8px] relative size-full">
              <Leading />
              <Shortcuts />
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Item">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex gap-[6px] items-center pl-[6px] pr-[8px] relative size-full">
              <Leading1 />
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Item">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex gap-[6px] items-center pl-[6px] pr-[8px] relative size-full">
              <Leading2 />
            </div>
          </div>
        </div>
        <div className="h-[21px] relative shrink-0 w-full" data-name="Separator">
          <div className="flex flex-col items-center justify-center size-full">
            <div className="content-stretch flex flex-col items-center justify-center px-[8px] relative size-full">
              <Separator1 />
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Item">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex gap-[6px] items-center pl-[6px] pr-[8px] relative size-full">
              <Leading3 />
            </div>
          </div>
        </div>
        <div className="h-[21px] relative shrink-0 w-full" data-name="Separator">
          <div className="flex flex-col items-center justify-center size-full">
            <div className="content-stretch flex flex-col items-center justify-center px-[8px] relative size-full">
              <Separator2 />
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Section Title">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center pb-[10px] pt-[4px] px-[8px] relative size-full">
              <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] overflow-hidden relative shrink-0 text-[#bfbfbf] text-[13px] text-ellipsis tracking-[-0.08px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                <p className="leading-[15px] overflow-hidden text-ellipsis">Section Title</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Item">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex gap-[6px] items-center pl-[6px] pr-[8px] relative size-full">
              <Leading4 />
              <div className="flex flex-col font-['SF_Pro:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#1a1a1a] text-[15px] text-center w-[14px]" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
                <p className="leading-[20px]">{`\u{10018A}`}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Item">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex gap-[6px] items-center pl-[6px] pr-[8px] relative size-full">
              <Leading5 />
              <div className="flex flex-col font-['SF_Pro:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#1a1a1a] text-[15px] text-center w-[14px]" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
                <p className="leading-[20px]">{`\u{10018A}`}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Item">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex gap-[6px] items-center pl-[6px] pr-[8px] relative size-full">
              <Leading6 />
              <div className="flex flex-col font-['SF_Pro:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#1a1a1a] text-[15px] text-center w-[14px]" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
                <p className="leading-[20px]">{`\u{10018A}`}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="h-[21px] relative shrink-0 w-full" data-name="Separator">
          <div className="flex flex-col items-center justify-center size-full">
            <div className="content-stretch flex flex-col items-center justify-center px-[8px] relative size-full">
              <Separator3 />
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Section Title">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center pb-[10px] pt-[4px] px-[8px] relative size-full">
              <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] overflow-hidden relative shrink-0 text-[#bfbfbf] text-[13px] text-ellipsis tracking-[-0.08px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                <p className="leading-[15px] overflow-hidden text-ellipsis">Section Title</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Item">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex gap-[6px] items-center pl-[6px] pr-[8px] relative size-full">
              <Leading7 />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[-266px] top-0" data-name="Frame">
      <div className="content-stretch flex flex-col items-center py-[10px] relative shrink-0 w-[228px]" data-name="Menu - iPhone">
        <FillShadow />
        <GlassEffect />
        <QuickActions />
        <MenuItems />
      </div>
    </div>
  );
}

export default function ContextMenu() {
  return (
    <div className="relative size-full" data-name="Context Menu">
      <ContentArea />
      <Frame />
    </div>
  );
}