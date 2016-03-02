/// Oscilloscope driver
///
/// (c) Koheron

#ifndef __DRIVERS_CORE_OSCILLO_HPP__
#define __DRIVERS_CORE_OSCILLO_HPP__

#include <vector>

#include <drivers/dev_mem.hpp>
#include <drivers/wr_register.hpp>
#include <drivers/addresses.hpp>

#include <signal/kvector.hpp>
 
#define SAMPLING_RATE 125E6

//> \description Oscilloscope driver
class Oscillo
{
  public:
    Oscillo(Klib::DevMem& dev_mem_);
    ~Oscillo();

    //> \description Open the device
    //> \io_type WRITE
    //> \status ERROR_IF_NEG
    //> \on_error Cannot open OSCILLO device
    //> \flag AT_INIT
    int Open(uint32_t waveform_size_);
    
    void Close();

    //> \description Read the acquired data
    //> \io_type READ
    Klib::KVector<float>& read_data(bool channel);
    
    //> \description Read all the acquired data
    //> \io_type READ
    Klib::KVector<float>& read_all_channels();

    //> \description Read all the acquired data
    //> \io_type READ
    std::vector<uint32_t> speed_test(uint32_t n_outer_loop, uint32_t n_inner_loop, uint32_t n_pts);

    //> \description Enable/disable averaging
    //> \io_type WRITE
    //> \param avg_status Status ON or OFF
    void set_averaging(bool avg_status);
    
    //> \description Number of averages
    //> \io_type READ
    uint32_t get_num_average();

    enum Status {
        CLOSED,
        OPENED,
        FAILED
    };

    //> \is_failed
    bool IsFailed() const {return status == FAILED;}

  private:
    Klib::DevMem& dev_mem;

    int status;
    
    bool avg_on; ///< True if averaging is enabled
    
    uint32_t waveform_size;
    uint32_t acq_time_us;

    // Memory maps IDs:
    Klib::MemMapID config_map;
    Klib::MemMapID status_map;
    Klib::MemMapID adc_1_map;
    Klib::MemMapID adc_2_map;
    
    // Acquired data buffers
    Klib::KVector<float> data;
    Klib::KVector<float> data_all;

    Klib::KVector<float> data_int;
    Klib::KVector<uint32_t> data_all_int;
    
    // Internal functions
    void _wait_for_acquisition();
    void _raw_to_vector(uint32_t *raw_data);
    void _raw_to_vector_all(uint32_t *raw_data_1, uint32_t *raw_data_2);
    void _raw_to_vector_all_int(uint32_t size, uint32_t *raw_data_1, uint32_t *raw_data_2);
}; // class Oscillo

#endif // __DRIVERS_CORE_OSCILLO_HPP__
