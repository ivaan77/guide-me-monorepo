import { City } from '@guide-me-app/core'

export const getCity = (cities: City[], cityId: string | undefined): City => {
    const city = cities.find((city) => city.id == cityId)

    if (!city) {
        throw new Error('Unknown city id')
    }

    return city
}
