import { BottomSheetRoot } from './BottomSheetRoot';
import { BottomSheetClose, BottomSheetContent, BottomSheetHeader, BottomSheetTitle } from './parts';

export { PEEK_HEIGHT_RATIO } from './context';

/**
 * 공통 바텀시트 컴포넌트 (항상 마운트)
 *
 * @example
 * ```tsx
 * <BottomSheet open={isOpen} onOpenChange={setIsOpen} onClose={handleClose}>
 *   <BottomSheet.Header>
 *     <BottomSheet.Title>정류장 정보</BottomSheet.Title>
 *     <BottomSheet.Close />
 *   </BottomSheet.Header>
 *   <BottomSheet.Content>...</BottomSheet.Content>
 * </BottomSheet>
 * ```
 */
export const BottomSheet = Object.assign(BottomSheetRoot, {
  Header: BottomSheetHeader,
  Title: BottomSheetTitle,
  Close: BottomSheetClose,
  Content: BottomSheetContent,
});
