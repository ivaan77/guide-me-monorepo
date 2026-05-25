import { PageHeader } from '@/components/forms/page-header'
import { CityForm } from '../city-form'

export default function NewCityPage() {
  return (
    <>
      <PageHeader title="New city" backHref="/discover/cities" />
      <CityForm mode="create" />
    </>
  )
}
