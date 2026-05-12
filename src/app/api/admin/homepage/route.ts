import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET - Fetch homepage config (public for frontend, full for admin)
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();

        // Get the config (there should be only one)
        const { data: config, error: configError } = await supabase
            .from('homepage_config')
            .select('*')
            .single();

        if (configError && configError.code !== 'PGRST116') {
            console.error('Error fetching homepage config:', configError);
            return NextResponse.json(
                { message: 'Failed to fetch homepage config' },
                { status: 500 }
            );
        }

        // Get sections
        const { data: sections, error: sectionsError } = await supabase
            .from('homepage_sections')
            .select('*')
            .eq('config_id', config?.id)
            .order('sort_order');

        // Get testimonials
        const { data: testimonials, error: testimonialsError } = await supabase
            .from('homepage_testimonials')
            .select('*')
            .eq('config_id', config?.id);

        const fullConfig = {
            ...config,
            sections: sections || [],
            testimonials: testimonials || []
        };

        return NextResponse.json(fullConfig);
    } catch (error) {
        console.error('Error fetching homepage config:', error);
        return NextResponse.json(
            { message: 'Failed to fetch homepage config' },
            { status: 500 }
        );
    }
}

// PUT - Update homepage config (admin only)
export async function PUT(request: NextRequest) {
    try {
        const authResult = await verifyAdminToken(request);
        if (authResult.error) {
            return NextResponse.json({ message: authResult.error }, { status: authResult.status });
        }

        const supabase = createClient();
        const body = await request.json();

        // Get existing config or create new one
        let { data: config, error: configError } = await supabase
            .from('homepage_config')
            .select('*')
            .single();

        let configId: string;

        if (configError && configError.code === 'PGRST116') {
            // Create new config
            const { data: newConfig, error: insertError } = await supabase
                .from('homepage_config')
                .insert({
                    featured_product_ids: body.featuredProductIds || [],
                    featured_products_count: body.featuredProductsCount || 8,
                    stats: body.stats || {
                        yearsExperience: 15,
                        satisfiedClients: 500,
                        partsAvailable: 5000,
                        onTimeDelivery: 98
                    },
                    hero_title: body.heroTitle || '',
                    hero_subtitle: body.heroSubtitle || '',
                    updated_by: authResult.user?.id
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error creating homepage config:', insertError);
                return NextResponse.json(
                    { message: 'Failed to create homepage config' },
                    { status: 500 }
                );
            }

            configId = newConfig.id;
            config = newConfig;
        } else if (configError) {
            console.error('Error fetching homepage config:', configError);
            return NextResponse.json(
                { message: 'Failed to fetch homepage config' },
                { status: 500 }
            );
        } else {
            // Update existing config
            configId = config.id;
            const updateData: any = { updated_by: authResult.user?.id };

            if (body.featuredProductIds !== undefined) {
                updateData.featured_product_ids = body.featuredProductIds;
            }
            if (body.featuredProductsCount !== undefined) {
                updateData.featured_products_count = body.featuredProductsCount;
            }
            if (body.stats !== undefined) {
                updateData.stats = { ...config.stats, ...body.stats };
            }
            if (body.heroTitle !== undefined) {
                updateData.hero_title = body.heroTitle;
            }
            if (body.heroSubtitle !== undefined) {
                updateData.hero_subtitle = body.heroSubtitle;
            }

            const { data: updatedConfig, error: updateError } = await supabase
                .from('homepage_config')
                .update(updateData)
                .eq('id', configId)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating homepage config:', updateError);
                return NextResponse.json(
                    { message: 'Failed to update homepage config' },
                    { status: 500 }
                );
            }

            config = updatedConfig;
        }

        // Update sections if provided
        if (body.sections !== undefined) {
            // Delete existing sections
            await supabase
                .from('homepage_sections')
                .delete()
                .eq('config_id', configId);

            // Insert new sections
            if (body.sections.length > 0) {
                const sectionsData = body.sections.map((section: any, index: number) => ({
                    config_id: configId,
                    section_id: section.sectionId || section.id,
                    label: section.label,
                    visible: section.visible !== undefined ? section.visible : true,
                    sort_order: index
                }));

                const { error: sectionsError } = await supabase
                    .from('homepage_sections')
                    .insert(sectionsData);

                if (sectionsError) {
                    console.error('Error updating sections:', sectionsError);
                }
            }
        }

        // Update testimonials if provided
        if (body.testimonials !== undefined) {
            // Delete existing testimonials
            await supabase
                .from('homepage_testimonials')
                .delete()
                .eq('config_id', configId);

            // Insert new testimonials
            if (body.testimonials.length > 0) {
                const testimonialsData = body.testimonials.map((testimonial: any) => ({
                    config_id: configId,
                    quote: testimonial.quote,
                    author: testimonial.author,
                    role: testimonial.role,
                    company: testimonial.company,
                    is_active: testimonial.isActive !== undefined ? testimonial.isActive : true
                }));

                const { error: testimonialsError } = await supabase
                    .from('homepage_testimonials')
                    .insert(testimonialsData);

                if (testimonialsError) {
                    console.error('Error updating testimonials:', testimonialsError);
                }
            }
        }

        // Return updated config with related data
        const { data: sections } = await supabase
            .from('homepage_sections')
            .select('*')
            .eq('config_id', configId)
            .order('sort_order');

        const { data: testimonials } = await supabase
            .from('homepage_testimonials')
            .select('*')
            .eq('config_id', configId);

        const fullConfig = {
            ...config,
            sections: sections || [],
            testimonials: testimonials || []
        };

        return NextResponse.json(fullConfig);
    } catch (error) {
        console.error('Error updating homepage config:', error);
        return NextResponse.json(
            { message: 'Failed to update homepage config' },
            { status: 500 }
        );
    }
}
