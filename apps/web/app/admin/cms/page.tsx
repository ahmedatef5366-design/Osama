import { useTranslations } from "next-intl";
import { CmsEditor } from "./cms-editor";

/**
 * Admin CMS landing page. Wrapper component holds the localized header;
 * the actual editor is a client component so it can manage edit state.
 */
export default function AdminCmsPage() {
  return <CmsPageWrapper />;
}

function CmsPageWrapper() {
  const t = useTranslations("admin.cms");
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-4xl font-extrabold text-text-1">{t("title")}</h1>
        <p className="text-text-2 text-sm">{t("subtitle")}</p>
      </header>
      <CmsEditor />
    </div>
  );
}
